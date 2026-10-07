import pytest
from unittest.mock import patch, MagicMock
from cli.main import run_agent, poll_status, download_patch

@patch("cli.main.urllib.request.urlopen")
def test_run_agent(mock_urlopen):
    mock_res = MagicMock()
    mock_res.read.return_value = b'{"run_id": "123"}'
    mock_res.__enter__.return_value = mock_res
    mock_urlopen.return_value = mock_res
    
    run_id = run_agent("http://github.com", "fix bug")
    assert run_id == "123"

@patch("cli.main.urllib.request.urlopen")
def test_poll_status(mock_urlopen):
    mock_res = MagicMock()
    mock_res.read.return_value = b'{"status": {"status": "COMPLETED_SUCCESS"}}'
    mock_res.__enter__.return_value = mock_res
    mock_urlopen.return_value = mock_res
    
    status = poll_status("123")
    assert status == "COMPLETED_SUCCESS"

@patch("cli.main.urllib.request.urlopen")
@patch("builtins.open", new_callable=MagicMock)
def test_download_patch(mock_open, mock_urlopen):
    mock_res = MagicMock()
    mock_res.read.return_value = b'diff content'
    mock_res.__enter__.return_value = mock_res
    mock_urlopen.return_value = mock_res
    
    download_patch("123")
    mock_open.assert_called_with("patch.diff", "w", encoding="utf-8")
