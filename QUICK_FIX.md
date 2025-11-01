# Quick Fix for ETIMEDOUT Error

## The Issue
`ETIMEDOUT` means your connection is being blocked by the security group.

## Fix in 2 Steps:

1. **AWS Console → RDS → Your Database → Connectivity & security**
   - Click the security group link
   
2. **Add Inbound Rule:**
   - Type: PostgreSQL
   - Port: 5432
   - Source: My IP (or get your IP from https://whatismyip.com)
   - Save

3. **Verify Public Access:**
   - RDS → Modify → Connectivity
   - Make sure "Publicly accessible" = Yes
   - If you changed it, wait for the modification to complete

4. **Wait 30 seconds** then retry

That's it!

