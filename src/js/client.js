"use strict";

if(typeof $ !== 'undefined'){
  const $ = require('jquery');  // jquery support if not loaded before
}

const wiki = {
  "mailbox": {
    "get_state": {
      "description": "Status (Quote, # ungelesen)"
    },
    "send_mail": {
      "description": "Schickt E-Mail an Empfaenger",
      "params": {
        "params-required": {
          "subject": "string",
          "to": "string"
        },
        "params-optional": {
          "bcc": "string",
          "body_plain": "string",
          "cc": "string",
          "import_session_files": "array",
          "text": "string"
        }
      }
    },
    "get_folders": {
      "description": "Ordnerliste"
    },
    "get_messages": {
      "description": "Nachrichten im Ordner",
      "params": {
        "params-required": {
          "folder_id": "string"
        }
      }
    },
    "read_messages": {
      "description": "Nachricht lesen",
      "params": {
        "params-required": {
          "folder_id": "string",
          "message_id": "int"
        }
      }
    },
    "export_session_file": {
      "description": "Session-Datei (Attachment) aus Nachricht exportieren",
      "params": {
        "params-required": {
          "folder_id": "string",
          "message_id": "int",
          "file_id": "string"
        }
      }
    }
  },
  "global": {
    "set_session": {
      "description": "Setzt die Session-ID der aktuellen Sitzung. Muss die erste aufgerufene Methode sein, falls vorhanden.",
      "params": {
        "session_id": "string"
      }
    },
    "set_options": {
      "description": "Setzt diverse globale Optionen.",
      "params": {
        "params-optional": {
          "locale": [
            "en",
            "de",
            "fr",
            "es",
            "it",
            "tr"
          ],
          "output": "serialized strings",
          "session_timeout": "int",
          "timeout": "float"
        }
      }
    },
    "get_nonce": {
      "description": "Nonce fuer Login generieren"
    },
    "login": {
      "description": "Knuepft Session an einen Benutzer (hex)hash=algorithm(nonce_key+salt+token).",
      "params": {
        "params-required": {
          "login": "string"
        },
        "params-optional": {
          "algorithm": [
            "md5",
            "sha1",
            "sha256",
            "sha512"
          ],
          "application": "string",
          "crypt": "string",
          "get_miniature": "bool",
          "get_properties": "mixed",
          "hash": "string",
          "is_hidden": "bool",
          "is_online": "bool",
          "is_volatile": "bool",
          "nonce_id": "string",
          "password": "string",
          "salt": "string"
        }
      }
    },
    "reload": {
      "description": "Login-Informationen neu lesen",
      "params": {
        "params-optional": {
          "get_miniature": "bool",
          "get_properties": "mixed"
        }
      }
    },
    "statistics": {
      "description": "Verschiedene Infos",
      "permission": "sysadmin"
    },
    "forward_event": {
      "description": "Weitergeleitetes Event (interne Verwendung)",
      "params": {
        "params-required": {
          "data": "mixed",
          "event": "string",
          "source": "string"
        }
      }
    }
  },
  "files": {
    "get_state": {
      "description": "Status (Quote, Proxy)"
    },
    "get_settings": {
      "description": "Liest Einstellungen",
      "permission": "files_admin"
    },
    "set_settings": {
      "description": ""
    }
  }
};
