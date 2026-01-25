# GLB File Structure Guide

## Current Issue

Some GLB files are currently stored in the `animation_url` field in the JSON metadata. While the code now supports detecting GLB files from `animation_url` as a fallback, this is not the recommended structure.

## Recommended Structure

For proper GLB file support, GLB files should be stored in `metadata.alternateModels.glb`:

```json
{
  "id": "avatar-id",
  "name": "Avatar Name",
  "model_file_url": "https://example.com/model.vrm",
  "format": "VRM",
  "metadata": {
    "alternateModels": {
      "glb": "https://example.com/model.glb",
      "fbx": "https://example.com/model.fbx"
    },
    "animation_url": "https://example.com/animation.mp4"  // For actual animations/previews
  }
}
```

## Migration Example

If you have GLB files in `animation_url`, you can migrate them to the proper structure:

### Before (Current - Works but not ideal):
```json
{
  "id": "0x776bd31ae5549eac9ed215b5db278229454d5bed/2",
  "name": "PEPE Trash Can",
  "model_file_url": "https://example.com/Pepe_TrashCan.vrm",
  "format": "VRM",
  "metadata": {
    "animation_url": "https://arweave.net/xyz123"  // This is actually a GLB file
  }
}
```

### After (Recommended):
```json
{
  "id": "0x776bd31ae5549eac9ed215b5db278229454d5bed/2",
  "name": "PEPE Trash Can",
  "model_file_url": "https://example.com/Pepe_TrashCan.vrm",
  "format": "VRM",
  "metadata": {
    "alternateModels": {
      "glb": "https://arweave.net/xyz123"  // GLB file in proper location
    },
    "animation_url": "https://example.com/animation.mp4"  // For actual animations if needed
  }
}
```

## Migration Script Example

If you want to migrate existing data, here's a Python script example:

```python
import json

def migrate_glb_from_animation_url(data_file):
    """Migrate GLB files from animation_url to metadata.alternateModels.glb"""
    
    with open(data_file, 'r') as f:
        avatars = json.load(f)
    
    migrated_count = 0
    
    for avatar in avatars:
        metadata = avatar.get('metadata', {})
        animation_url = metadata.get('animation_url')
        
        # Check if animation_url is a GLB file
        if animation_url and (animation_url.endswith('.glb') or '.glb' in animation_url.lower()):
            # Initialize alternateModels if it doesn't exist
            if 'alternateModels' not in metadata:
                metadata['alternateModels'] = {}
            
            # Only migrate if glb doesn't already exist
            if 'glb' not in metadata.get('alternateModels', {}):
                metadata['alternateModels']['glb'] = animation_url
                migrated_count += 1
                print(f"Migrated GLB for: {avatar.get('name', avatar.get('id'))}")
    
    # Save the updated data
    with open(data_file, 'w') as f:
        json.dump(avatars, f, indent=2)
    
    print(f"\nMigration complete! Migrated {migrated_count} GLB files.")

# Usage:
# migrate_glb_from_animation_url('data/avatars/NeonGlitch86.json')
```

## Code Support

The codebase now supports GLB files from multiple sources (in order of priority):

1. **`metadata.alternateModels.glb`** (Recommended - Primary source)
2. **`metadata.animation_url`** (Fallback - Detects if URL points to GLB)
3. **Inferred from VRM URLs** (If description mentions GLB or ardriveFiles contains GLB)
4. **`metadata.ardriveFiles.models`** (If filename ends with .glb)

This ensures backward compatibility while encouraging the proper structure going forward.
