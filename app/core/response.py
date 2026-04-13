def api_success(data=None):
    return {"success": True, "data": data, "error": None}


def api_error(message: str, data=None):
    return {"success": False, "data": data, "error": message}
