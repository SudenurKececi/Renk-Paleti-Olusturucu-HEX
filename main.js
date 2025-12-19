const { app, BrowserWindow } = require('electron');
const path = require('path');

// EKLEME 1: Bazı sistemlerde imleç ve grafik hatalarını çözer
app.disableHardwareAcceleration(); 

function createWindow() {
    const win = new BrowserWindow({
        width: 1100, // Biraz daha geniş başlasın
        height: 750,
        minWidth: 900,
        minHeight: 600,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    // Menü çubuğunu tamamen kaldırmak istersen:
    win.setMenuBarVisibility(false);

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});