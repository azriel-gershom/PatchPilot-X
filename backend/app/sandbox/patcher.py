import os
from app.sandbox.diff_utils import generate_unified_diff
from app.core.storage import BASE_DIR

class PatchGenerator:
    def generate_patch(self, modifications: list[dict]) -> str:
        """
        modifications is a list of dicts:
        {
            "file_path": str,
            "original": str,
            "modified": str
        }
        Returns the combined unified patch string.
        """
        diffs = []
        for mod in modifications:
            file_path = mod["file_path"]
            original = mod["original"]
            modified = mod["modified"]
            
            diff = generate_unified_diff(original, modified, file_path)
            if diff:
                diffs.append(diff)
                
        # Join diffs, ensuring no excessive newlines
        joined = "".join(diffs)
        return joined

    def generate_and_save_patch(self, run_id: str, modifications: list[dict]) -> str:
        patch_content = self.generate_patch(modifications)
        run_dir = os.path.join(BASE_DIR, run_id)
        os.makedirs(run_dir, exist_ok=True)
        file_path = os.path.join(run_dir, "patch.diff")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(patch_content)
        return patch_content
