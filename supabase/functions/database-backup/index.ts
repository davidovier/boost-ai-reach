import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createSecureLogger } from "../_shared/secure-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Encryption utility using Web Crypto API
class BackupEncryption {
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  private static async keyToBase64(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  private static async base64ToKey(base64: string): Promise<CryptoKey> {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
  }

  static async encrypt(data: string): Promise<{ encrypted: string; key: string; iv: string }> {
    const key = await this.generateKey();
    const keyBase64 = await this.keyToBase64(key);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedData
    );
    
    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      key: keyBase64,
      iv: btoa(String.fromCharCharCode(...iv))
    };
  }

  static async decrypt(encryptedBase64: string, keyBase64: string, ivBase64: string): Promise<string> {
    const key = await this.base64ToKey(keyBase64);
    const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
    const encrypted = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }

  static async hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  }
}

// Tables to backup (excluding auth tables managed by Supabase)
const BACKUP_TABLES = [
  'profiles',
  'sites', 
  'scans',
  'prompt_simulations',
  'competitors',
  'competitor_snapshots',
  'reports',
  'tips',
  'usage_metrics',
  'user_events',
  'audit_logs',
  'subscriptions',
  'plans',
  'dashboard_configs',
  'feature_flags',
  'backup_metadata'
];

async function exportTableData(supabase: any, tableName: string, logger: any): Promise<any[]> {
  logger.info(`Starting export of table: ${tableName}`);
  
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + batchSize - 1);
    
    if (error) {
      logger.error(`Error exporting table ${tableName}`, error);
      throw new Error(`Failed to export ${tableName}: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      break;
    }
    
    allData = allData.concat(data);
    from += batchSize;
    
    logger.debug(`Exported ${data.length} records from ${tableName} (total: ${allData.length})`);
  }
  
  logger.info(`Completed export of table ${tableName}: ${allData.length} records`);
  return allData;
}

async function createBackup(supabase: any, logger: any): Promise<{
  success: boolean;
  filePath?: string;
  error?: string;
  metadata?: any;
}> {
  const backupDate = new Date().toISOString().split('T')[0];
  const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup_${backupTimestamp}.json`;
  
  try {
    logger.info('Starting database backup process', { date: backupDate });
    
    // Create backup metadata record
    const { data: backupRecord, error: metadataError } = await supabase
      .from('backup_metadata')
      .insert({
        backup_date: backupDate,
        file_path: fileName,
        tables_backed_up: BACKUP_TABLES,
        encryption_key_hash: 'pending', // Will update after encryption
        status: 'in_progress'
      })
      .select()
      .single();
    
    if (metadataError) {
      logger.error('Failed to create backup metadata', metadataError);
      throw new Error(`Failed to create backup metadata: ${metadataError.message}`);
    }
    
    const backupId = backupRecord.id;
    logger.info('Created backup metadata record', { backupId });
    
    // Export all table data
    const backupData: { [tableName: string]: any[] } = {};
    let totalRecords = 0;
    
    for (const tableName of BACKUP_TABLES) {
      try {
        const tableData = await exportTableData(supabase, tableName, logger);
        backupData[tableName] = tableData;
        totalRecords += tableData.length;
      } catch (error) {
        logger.error(`Failed to export table ${tableName}`, error);
        
        // Update backup status to failed
        await supabase
          .from('backup_metadata')
          .update({
            status: 'failed',
            error_message: `Failed to export table ${tableName}: ${error.message}`
          })
          .eq('id', backupId);
        
        return {
          success: false,
          error: `Failed to export table ${tableName}: ${error.message}`
        };
      }
    }
    
    logger.info('Completed data export', { totalRecords, tables: BACKUP_TABLES.length });
    
    // Create backup object with metadata
    const backupObject = {
      version: '1.0',
      created_at: new Date().toISOString(),
      backup_date: backupDate,
      total_records: totalRecords,
      tables: BACKUP_TABLES,
      data: backupData
    };
    
    // Convert to JSON and encrypt
    const jsonData = JSON.stringify(backupObject, null, 2);
    logger.info('Prepared backup data for encryption', { 
      sizeBytes: jsonData.length,
      sizeMB: Math.round(jsonData.length / 1024 / 1024 * 100) / 100
    });
    
    const { encrypted, key, iv } = await BackupEncryption.encrypt(jsonData);
    const keyHash = await BackupEncryption.hashKey(key);
    
    logger.info('Data encrypted successfully');
    
    // Create final backup file with encryption metadata
    const encryptedBackup = {
      version: '1.0',
      encrypted: true,
      created_at: new Date().toISOString(),
      backup_date: backupDate,
      encryption_iv: iv,
      data: encrypted
    };
    
    const finalBackupData = JSON.stringify(encryptedBackup);
    const fileSize = finalBackupData.length;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('backups')
      .upload(fileName, finalBackupData, {
        contentType: 'application/json',
        upsert: false
      });
    
    if (uploadError) {
      logger.error('Failed to upload backup file', uploadError);
      
      await supabase
        .from('backup_metadata')
        .update({
          status: 'failed',
          error_message: `Failed to upload backup: ${uploadError.message}`
        })
        .eq('id', backupId);
      
      return {
        success: false,
        error: `Failed to upload backup: ${uploadError.message}`
      };
    }
    
    logger.info('Backup file uploaded successfully', { fileName, fileSize });
    
    // Update backup metadata with completion
    const { error: updateError } = await supabase
      .from('backup_metadata')
      .update({
        status: 'completed',
        file_size: fileSize,
        encryption_key_hash: keyHash
      })
      .eq('id', backupId);
    
    if (updateError) {
      logger.warn('Failed to update backup metadata', updateError);
    }
    
    // Store encryption key securely (in real implementation, this should be stored in a secure key management system)
    // For now, we'll log it securely (it will be masked in logs)
    logger.info('Backup completed successfully', {
      fileName,
      fileSize,
      totalRecords,
      encryptionKeyHash: keyHash.substring(0, 8) + '...',
      // CRITICAL: In production, store this key in a secure key management system
      encryptionKey: key
    });
    
    return {
      success: true,
      filePath: fileName,
      metadata: {
        backupId,
        totalRecords,
        fileSize,
        tables: BACKUP_TABLES.length
      }
    };
    
  } catch (error) {
    logger.error('Backup process failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

serve(async (req) => {
  const logger = createSecureLogger(req);
  logger.logRequestStart(req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only allow POST requests (for manual triggers) and cron calls
  if (req.method !== 'POST') {
    logger.warn('Method not allowed', { method: req.method });
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
  
  try {
    // Initialize Supabase client with service role for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if storage bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const backupBucketExists = buckets?.some(bucket => bucket.name === 'backups');
    
    if (!backupBucketExists) {
      logger.info('Creating backups storage bucket');
      const { error: bucketError } = await supabase.storage.createBucket('backups', {
        public: false,
        fileSizeLimit: 1024 * 1024 * 1024 // 1GB limit
      });
      
      if (bucketError) {
        logger.error('Failed to create backup bucket', bucketError);
        return new Response(
          JSON.stringify({ error: 'Failed to create storage bucket' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // Create the backup
    const result = await createBackup(supabase, logger);
    
    if (result.success) {
      logger.info('Backup process completed successfully', result.metadata);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Database backup completed successfully',
          ...result.metadata
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      logger.error('Backup process failed', { error: result.error });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
  } catch (error) {
    logger.error('Unexpected error in backup function', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});