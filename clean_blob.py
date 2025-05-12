import sys

# Check if the blob likely contains a GitHub token (adjust pattern if needed)
# Using a simple check for 'ghp_' which is the prefix for GitHub PATs
# A more robust check might involve regex for the full token pattern
if b'ghp_' in blob.data and b'mcp.json' in blob.original_path: 
  print(f"Replacing content of blob {blob.id.decode('utf-8', 'surrogateescape')} in path {blob.original_path.decode('utf-8', 'surrogateescape')}", file=sys.stderr)
  blob.data = b'# Content removed due to sensitive data'
else:
  # Keep other blobs unchanged
  pass 