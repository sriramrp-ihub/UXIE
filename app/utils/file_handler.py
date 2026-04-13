import os
import uuid
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path


def save_upload_to_disk(file_bytes: bytes, suffix: str = ".zip") -> Path:
    temp_dir = Path("storage/tmp")
    temp_dir.mkdir(parents=True, exist_ok=True)
    file_path = temp_dir / f"{uuid.uuid4()}{suffix}"
    file_path.write_bytes(file_bytes)
    return file_path


def extract_scorm_zip(zip_path: Path, destination_root: Path) -> Path:
    extract_dir = destination_root / str(uuid.uuid4())
    extract_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_dir)
    return extract_dir


def parse_imsmanifest(manifest_path: Path) -> dict[str, str | None]:
    if not manifest_path.exists():
        return {"title": None, "launch": None}

    tree = ET.parse(manifest_path)
    root = tree.getroot()

    title_elem = root.find(".//{*}title")
    resource_elem = root.find(".//{*}resource")
    launch_href = resource_elem.attrib.get("href") if resource_elem is not None else None

    return {
        "title": title_elem.text if title_elem is not None else None,
        "launch": launch_href,
    }


def build_served_scorm_url(base_dir: Path, extract_dir: Path, launch_file: str | None) -> str:
    relative_dir = os.path.relpath(extract_dir, base_dir)
    if launch_file:
        return f"/scorm-content/{relative_dir}/{launch_file}"
    return f"/scorm-content/{relative_dir}/"
