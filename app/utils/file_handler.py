import os
import uuid
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from urllib.parse import quote


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
        for member in zip_ref.infolist():
            member_path = extract_dir / member.filename
            resolved = member_path.resolve()
            if not str(resolved).startswith(str(extract_dir.resolve())):
                raise ValueError("Invalid ZIP: path traversal attempt detected")
        zip_ref.extractall(extract_dir)
    return extract_dir


def parse_imsmanifest(manifest_path: Path) -> dict:
    if not manifest_path.exists():
        return {"title": None, "launch": None, "activities": []}

    tree = ET.parse(manifest_path)
    root = tree.getroot()

    title_elem = root.find("./{*}organizations/{*}organization/{*}title") or root.find(
        ".//{*}title"
    )

    resources_by_id: dict[str, str] = {}
    for resource_elem in root.findall(".//{*}resources/{*}resource"):
        identifier = resource_elem.attrib.get("identifier")
        href = resource_elem.attrib.get("href")
        if identifier and href:
            resources_by_id[identifier] = href

    activities: list[dict[str, str]] = []
    for item_elem in root.findall(".//{*}organizations/{*}organization//{*}item"):
        identifier = item_elem.attrib.get("identifier", "")
        resource_ref = item_elem.attrib.get("identifierref", "")
        title = (item_elem.findtext("{*}title") or identifier or "SCO").strip()
        href = resources_by_id.get(resource_ref)
        if href:
            activities.append({"identifier": identifier, "title": title, "launch": href})

    launch_href = activities[0]["launch"] if activities else None
    if launch_href is None and resources_by_id:
        launch_href = next(iter(resources_by_id.values()))

    return {
        "title": title_elem.text if title_elem is not None else None,
        "launch": launch_href,
        "activities": activities,
    }


def build_served_scorm_url(base_dir: Path, extract_dir: Path, launch_file: str | None) -> str:
    relative_dir = os.path.relpath(extract_dir, base_dir)
    if launch_file:
        encoded_path = "/".join(quote(part) for part in launch_file.split("/"))
        return f"/scorm-content/{relative_dir}/{encoded_path}"
    return f"/scorm-content/{relative_dir}/"
