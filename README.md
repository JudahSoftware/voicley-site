# voicley-site

The public website for **Voicley** — https://judahsoftware.github.io/voicley-site/

- `index.html` — the whole site (self-contained; no external assets).
- `VoicleySetup.exe` — the **public** Windows installer: built WITHOUT the
  embedded OpenAI key (never distribute that build variant publicly). Live
  dictation works out of the box via the embedded spend-capped Deepgram key;
  Whisper fallback + AI titles activate when a user enters their own OpenAI
  key in Settings.
- `supabase-signups.sql` — run this in the Voicley Supabase project's SQL
  editor to upgrade the early-access form from mailto to a real table
  (insert-only anon policy), then wire the publishable key into index.html.

## Publishing a new installer

From the app repo root (builds WITHOUT the OpenAI key on purpose):

```powershell
dart run tool/embed_key.dart          # writes secrets\*.obf
# read secrets\deepgram_key.obf into $dgObf, delete both .obf files
flutter build windows --release "--dart-define=DEEPGRAM_KEY_OBF=$dgObf"
& "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe" /DMyAppVersion=<x.y.z.NN> installer\voicley.iss
# copy installer\Output\"Voicley Setup.exe" here as VoicleySetup.exe, commit, push
```

Site working spec: `docs/website.md` in the app repo.
