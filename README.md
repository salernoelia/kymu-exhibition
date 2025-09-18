# Kymu Exhibition App

![Kymu Exhibition Overview](/public/kymu-exhibition-overview.png)

Interactive therapy exercises using webcam body tracking - designed for TV displays. Part of the [Kymu](https://github.com/salernoelia/kymu) rehabilitation platform.

- Tracks your body movements through webcam using MediaPipe
- Guides you through rehab exercises with real-time feedback
- Measures joint angles and range of motion
- Gives audio/visual cues when you hit movement targets
- Saves progress to local database


## Quick start

```bash
git clone https://github.com/salernoelia/kymu-exhibition.git
cd kymu-exhibition
npm install
npm run dev
```

Open `http://localhost:3000` - allow camera access when prompted.

## TV/Kiosk Mode

**macOS:**
```bash
chmod +x START_EXHIBITION.sh
./START_EXHIBITION.sh
```

**Windows:**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --kiosk ^
  --disable-web-security ^
  --start-fullscreen ^
  --app=http://localhost:3000
```

## Configuration

- `assets/exercises_config.json` - Exercise sequences
- `assets/pose_config.json` - Joint angle targets
- `assets/remote_config.json` - Remote control mapping

[Bluetooth Remote](https://github.com/salernoelia/kymu-exhibition-remote) available separately.
