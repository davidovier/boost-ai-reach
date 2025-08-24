# Database Restore Guide

This guide provides step-by-step instructions for restoring your FindableAI database from encrypted backups.

## ⚠️ CRITICAL SECURITY NOTICE

**NEVER share or commit encryption keys to version control or unsecured locations.**

The encryption keys are logged during backup creation for admin access. In production, these should be stored in a secure key management system (AWS KMS, Azure Key Vault, HashiCorp Vault, etc.).

## Prerequisites

Before starting the restore process, ensure you have:

- [ ] Admin access to the Supabase project
- [ ] Access to the backup file and encryption key
- [ ] A target database (existing or new Supabase project)
- [ ] Node.js or Deno environment for running restore scripts

## Backup File Structure

Each backup file contains:
```json
{
  "version": "1.0",
  "encrypted": true,
  "created_at": "2024-01-15T02:00:00.000Z",
  "backup_date": "2024-01-15",
  "encryption_iv": "base64-encoded-initialization-vector",
  "data": "encrypted-backup-data"
}
```

## Restore Process

### Step 1: Locate Your Backup

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Storage → backups bucket

2. **Download Backup File**
   ```bash
   # Using Supabase CLI
   supabase storage download --bucket backups backup_2024-01-15T02-00-00-000Z.json
   
   # Or download via dashboard UI
   ```

3. **Get Encryption Key**
   - Check the backup logs in Edge Functions → database-backup → logs
   - Look for the log entry with `encryptionKey` field
   - **SECURITY**: In production, retrieve from your key management system

### Step 2: Decrypt the Backup

Create a decrypt script (`decrypt-backup.js`):

```javascript
import { createHash } from 'crypto';

class BackupDecryption {
  static async base64ToKey(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["decrypt"]);
  }

  static async decrypt(encryptedBase64, keyBase64, ivBase64) {
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
}

// Usage
const backupFile = JSON.parse(await Deno.readTextFile('./backup_2024-01-15T02-00-00-000Z.json'));
const encryptionKey = 'YOUR_ENCRYPTION_KEY_HERE'; // From logs or key management system

const decryptedData = await BackupDecryption.decrypt(
  backupFile.data,
  encryptionKey,
  backupFile.encryption_iv
);

const backupData = JSON.parse(decryptedData);
console.log('Backup decrypted successfully');
console.log(`Tables: ${Object.keys(backupData.data).length}`);
console.log(`Total records: ${backupData.total_records}`);

// Save decrypted data
await Deno.writeTextFile('./decrypted-backup.json', JSON.stringify(backupData, null, 2));
```

Run the decrypt script:
```bash
deno run --allow-read --allow-write decrypt-backup.js
```

### Step 3: Prepare Target Database

1. **Create New Supabase Project** (if needed)
   ```bash
   # Using Supabase CLI
   supabase projects create my-restored-project
   ```

2. **Run Migrations**
   - Apply all database migrations to set up the schema
   ```bash
   supabase db push
   ```

3. **Verify Schema**
   - Ensure all tables exist and match the backup structure

### Step 4: Restore Data

Create a restore script (`restore-data.js`):

```javascript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'YOUR_TARGET_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Order matters! Restore tables with foreign key dependencies last
const RESTORE_ORDER = [
  'profiles',
  'plans',
  'sites',
  'scans',
  'tips',
  'competitors',
  'competitor_snapshots',
  'prompt_simulations',
  'reports',
  'usage_metrics',
  'user_events',
  'audit_logs',
  'subscriptions',
  'dashboard_configs',
  'feature_flags',
  'backup_metadata'
];

async function restoreTable(tableName, data) {
  console.log(`Restoring table: ${tableName} (${data.length} records)`);
  
  if (data.length === 0) {
    console.log(`Skipping ${tableName} - no data`);
    return;
  }
  
  // Batch insert to handle large datasets
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from(tableName)
      .insert(batch);
    
    if (error) {
      console.error(`Error inserting batch into ${tableName}:`, error);
      
      // Try individual inserts to identify problematic records
      for (const record of batch) {
        const { error: singleError } = await supabase
          .from(tableName)
          .insert(record);
        
        if (singleError) {
          console.error(`Failed to insert record in ${tableName}:`, record.id || 'unknown', singleError.message);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
  }
  
  console.log(`✅ Restored ${inserted}/${data.length} records for ${tableName}`);
}

async function restoreDatabase() {
  const backupData = JSON.parse(await Deno.readTextFile('./decrypted-backup.json'));
  
  console.log('Starting database restore...');
  console.log(`Backup date: ${backupData.backup_date}`);
  console.log(`Total records: ${backupData.total_records}`);
  
  for (const tableName of RESTORE_ORDER) {
    if (backupData.data[tableName]) {
      await restoreTable(tableName, backupData.data[tableName]);
    } else {
      console.log(`⚠️  Table ${tableName} not found in backup`);
    }
  }
  
  console.log('✅ Database restore completed!');
}

// Run restore
try {
  await restoreDatabase();
} catch (error) {
  console.error('❌ Restore failed:', error);
  Deno.exit(1);
}
```

Run the restore:
```bash
deno run --allow-read --allow-net restore-data.js
```

### Step 5: Verify Restoration

1. **Check Record Counts**
   ```sql
   -- Compare record counts with backup metadata
   SELECT 
     schemaname,
     tablename,
     n_tup_ins as rows_inserted
   FROM pg_stat_user_tables 
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

2. **Test Core Functionality**
   - [ ] User authentication works
   - [ ] Sites can be created and scanned
   - [ ] Prompts can be run
   - [ ] Reports can be generated
   - [ ] Admin functions are accessible

3. **Verify Data Integrity**
   ```sql
   -- Check for missing foreign key references
   SELECT COUNT(*) FROM sites s 
   LEFT JOIN profiles p ON s.user_id = p.id 
   WHERE p.id IS NULL;
   
   -- Check for orphaned records
   SELECT COUNT(*) FROM scans sc 
   LEFT JOIN sites s ON sc.site_id = s.id 
   WHERE s.id IS NULL;
   ```

### Step 6: Update Configuration

1. **Update Application URLs** (if restoring to new project)
   - Update Supabase project URL in client configuration
   - Update any hardcoded references

2. **Reset User Sessions**
   ```sql
   -- Clear existing sessions to force re-authentication
   DELETE FROM auth.sessions;
   ```

3. **Update Cron Jobs**
   - Verify backup cron job is scheduled for new project
   - Update any other scheduled tasks

## Troubleshooting

### Common Issues

1. **Foreign Key Violations**
   ```sql
   -- Temporarily disable foreign key checks
   SET session_replication_role = replica;
   -- Run your restore
   SET session_replication_role = DEFAULT;
   ```

2. **Duplicate Key Errors**
   ```sql
   -- Check for existing data
   SELECT tablename, n_tup_ins FROM pg_stat_user_tables 
   WHERE schemaname = 'public' AND n_tup_ins > 0;
   ```

3. **Large Dataset Timeouts**
   - Increase batch size for smaller tables
   - Decrease batch size for tables with large records
   - Consider using `COPY` command for very large datasets

4. **Encryption Key Issues**
   - Verify key format (should be base64)
   - Check logs for the correct encryption key
   - Ensure IV matches the backup file

### Validation Queries

```sql
-- Verify user data integrity
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN plan = 'free' THEN 1 END) as free_users
FROM profiles;

-- Check scan data
SELECT 
  COUNT(*) as total_scans,
  COUNT(DISTINCT site_id) as unique_sites,
  AVG(ai_findability_score) as avg_score
FROM scans 
WHERE ai_findability_score IS NOT NULL;

-- Verify recent activity
SELECT 
  DATE(created_at) as date,
  COUNT(*) as events
FROM user_events 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Recovery Testing

**Test your restore process regularly:**

1. **Monthly Test Restore**
   - Download latest backup
   - Restore to test environment
   - Verify functionality
   - Document any issues

2. **Disaster Recovery Drill**
   - Simulate complete data loss
   - Execute full restore procedure
   - Measure restoration time
   - Update procedures based on learnings

## Security Best Practices

1. **Encryption Key Management**
   - Use a dedicated key management system
   - Implement key rotation policy
   - Never store keys in version control
   - Separate backup and restore keys

2. **Access Control**
   - Limit backup file access to essential personnel
   - Use time-limited access tokens
   - Audit backup file downloads
   - Implement principle of least privilege

3. **Backup Verification**
   - Regularly test backup decryption
   - Verify backup completeness
   - Check backup file integrity
   - Monitor backup creation failures

## Emergency Contacts

In case of emergency restoration needs:

- **Database Admin**: [Contact Info]
- **DevOps Team**: [Contact Info]  
- **Supabase Support**: https://supabase.com/support

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Tested By**: [Admin Name]  
**Next Review**: [Date]