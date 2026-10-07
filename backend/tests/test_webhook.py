import pytest
from app.services.webhook import WebhookNotifier
from unittest.mock import patch, MagicMock

@pytest.mark.asyncio
@patch("app.services.webhook.urllib.request.urlopen")
@patch.dict("os.environ", {"WEBHOOK_URL": "http://test.com"})
async def test_webhook_notify(mock_urlopen):
    mock_urlopen.return_value.__enter__.return_value = MagicMock()
    notifier = WebhookNotifier()
    await notifier.notify("123", "COMPLETED_SUCCESS", "patch")
    mock_urlopen.assert_called_once()
