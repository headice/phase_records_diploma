import mimetypes
import re
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse
from django.utils._os import safe_join
from django.utils.http import http_date


RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)$")
CHUNK_SIZE = 8192


def _iter_file_range(file_obj, start, length):
    try:
        file_obj.seek(start)
        remaining = length
        while remaining > 0:
            chunk = file_obj.read(min(CHUNK_SIZE, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk
    finally:
        file_obj.close()


def _range_not_satisfiable(size):
    response = HttpResponse(status=416)
    response["Content-Range"] = f"bytes */{size}"
    response["Accept-Ranges"] = "bytes"
    return response


def serve_media_file(request, path):
    try:
        full_path = Path(safe_join(settings.MEDIA_ROOT, path))
    except ValueError as exc:
        raise Http404("Media file not found") from exc

    if not full_path.is_file():
        raise Http404("Media file not found")

    file_size = full_path.stat().st_size
    content_type, encoding = mimetypes.guess_type(str(full_path))
    content_type = content_type or "application/octet-stream"
    range_header = request.headers.get("Range", "")

    if range_header:
        match = RANGE_RE.match(range_header.strip())
        if not match:
            return _range_not_satisfiable(file_size)

        start_raw, end_raw = match.groups()
        if start_raw == "" and end_raw == "":
            return _range_not_satisfiable(file_size)

        if start_raw == "":
            suffix_length = int(end_raw)
            if suffix_length <= 0:
                return _range_not_satisfiable(file_size)
            start = max(file_size - suffix_length, 0)
            end = file_size - 1
        else:
            start = int(start_raw)
            end = int(end_raw) if end_raw else file_size - 1

        if start >= file_size or end < start:
            return _range_not_satisfiable(file_size)

        end = min(end, file_size - 1)
        length = end - start + 1
        file_obj = full_path.open("rb")
        response = StreamingHttpResponse(
            _iter_file_range(file_obj, start, length),
            status=206,
            content_type=content_type,
        )
        response["Content-Length"] = str(length)
        response["Content-Range"] = f"bytes {start}-{end}/{file_size}"
    else:
        response = FileResponse(full_path.open("rb"), content_type=content_type)
        response["Content-Length"] = str(file_size)

    response["Accept-Ranges"] = "bytes"
    response["Last-Modified"] = http_date(full_path.stat().st_mtime)
    response["Cache-Control"] = "public, max-age=604800"
    if encoding:
        response["Content-Encoding"] = encoding
    return response
