import os
import site
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DEPS_PATH = BASE_DIR / ".deps"
DEPS_DJANGO_INIT = DEPS_PATH / "django" / "__init__.py"
LOCAL_VENV_PYTHON = (
    BASE_DIR / "venv" / "Scripts" / "python.exe"
    if os.name == "nt"
    else BASE_DIR / "venv" / "bin" / "python"
)


def _ensure_user_site():
    user_site = site.getusersitepackages()
    if user_site and user_site not in sys.path:
        site.addsitedir(user_site)


def _django_is_importable():
    try:
        import django
        return True
    except ImportError:
        return False


def _configure_dependency_paths():
    if _django_is_importable():
        return

    _ensure_user_site()
    if _django_is_importable():
        return

    try:
        if DEPS_DJANGO_INIT.is_file() and os.access(DEPS_DJANGO_INIT, os.R_OK):
            sys.path.insert(0, str(DEPS_PATH))
    except OSError:
        pass


_configure_dependency_paths()


def _maybe_reexec_local_venv():
    if os.environ.get("PHASE_RECORDS_MANAGEPY_REEXEC") == "1":
        return

    try:
        current_python = Path(sys.executable).resolve()
        local_venv_python = LOCAL_VENV_PYTHON.resolve()
    except OSError:
        return

    if not local_venv_python.is_file() or current_python == local_venv_python:
        return

    os.environ["PHASE_RECORDS_MANAGEPY_REEXEC"] = "1"
    os.execv(str(local_venv_python), [str(local_venv_python), *sys.argv])


def _require_supported_django():
    import django

    if sys.version_info >= (3, 14) and django.VERSION < (5, 2):
        version = django.get_version()
        raise RuntimeError(
            "Django "
            f"{version} is too old for Python {sys.version_info.major}.{sys.version_info.minor}. "
            "Install the project requirements into the active virtualenv "
            "(`.\\venv\\Scripts\\python -m pip install -r requirements.txt`) "
            "and run the server again."
        )


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "phase_backend.settings")
    try:
        _maybe_reexec_local_venv()
        _require_supported_django()
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
