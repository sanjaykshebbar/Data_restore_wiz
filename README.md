# Data Restore Wiz 🧙‍♂️

A Cross-Platform (Windows <-> macOS) Backup & Restoration Tool designed for local network transfers. It features auto-discovery (ZeroConf/Bonjour), secure transfer (TCP/TLS), and a "Zero Trace" ephemeral execution mode.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey)

## 🚀 Instant "Zero Trace" Execution

Run the application instantly without manually cloning or keeping files on your system. These commands will:
1.  Create a temporary directory.
2.  Clone the repository.
3.  Install dependencies (requires Node.js).
4.  Run the application.
5.  **Automatically delete** the project files when you close the app.
6.  Save a log file to your Desktop.

### Choose your OS:

<details open>
<summary><b>🪟 Windows (PowerShell)</b></summary>

Copy and paste this into PowerShell:

```powershell
irm https://raw.githubusercontent.com/sanjaykshebbar/Data_restore_wiz/main/start.ps1 | iex
```

*Note: You may need to run `Set-ExecutionPolicy RemoteSigned -Scope Process` if scripts are disabled.*
</details>

<details>
<summary><b>🍎 macOS / Linux (Bash)</b></summary>

Copy and paste this into your Terminal:

```bash
curl -sL https://raw.githubusercontent.com/sanjaykshebbar/Data_restore_wiz/main/start.sh | bash
```
</details>

---

## 🛠️ Prerequisites

Before running, ensure you have the following installed:

*   **Node.js (v16+)**: [Download Here](https://nodejs.org/)
*   **Git**: [Download Here](https://git-scm.com/)

---

## 🔧 Manual Setup & Installation

If you prefer to install the application permanently:

<details>
<summary><b>🪟 Windows Setup</b></summary>

1.  **Clone the repository:**
    ```powershell
    git clone https://github.com/sanjaykshebbar/Data_restore_wiz.git
    cd Data_restore_wiz
    ```

2.  **Install dependencies:**
    ```powershell
    npm install
    ```

3.  **Run the application:**
    ```powershell
    npm run dev
    ```

4.  **Build for Production (executable):**
    ```powershell
    npm run build:win
    ```
</details>

<details>
<summary><b>🍎 macOS Setup</b></summary>

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sanjaykshebbar/Data_restore_wiz.git
    cd Data_restore_wiz
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application:**
    ```bash
    npm run dev
    ```

4.  **Build for Production (.dmg):**
    ```bash
    npm run build:mac
    ```
</details>

---

## 🛡️ Firewall & Permissions

To ensure the application can discover devices and transfer files, specific permissions are required.

### 📶 Network Ports
The application uses the following ports. Ensure they are allowed through your firewall:

*   **TCP Port 1234**: Main data transfer channel.
*   **UDP Port 5353**: mDNS (Bonjour/ZeroConf) for device discovery.

### 🔑 OS Permissions

<details>
<summary><b>🪟 Windows Configuration</b></summary>

*   **Firewall Prompt:** When you first launch the app, Windows Firewall may ask to allow `Node.js` or `Electron`. Check **Private networks** (and Public if you are on a public WiFi) and click **Allow access**.
*   **File Access:** The app requires read access to your User folders (Documents, Pictures, etc.) specific to the user running the process.
</details>

<details>
<summary><b>🍎 macOS Configuration</b></summary>

*   **Network (Local Network Privacy):** On macOS Sequoia/Sonoma, you may see a prompt "Data Restore Wiz would like to find and connect to devices on your local network". Click **Allow**.
*   **Full Disk Access:** For the "Sender" role to scan all applications and user data effectively, grant **Full Disk Access**:
    1.  System Settings -> Privacy & Security -> Full Disk Access.
    2.  Add `Terminal` (if running via CLI) or the `Data Restore Wiz.app`.
</details>

---

## 🏗️ How It Works

1.  **Discovery**: Uses Multicast DNS (mDNS) to broadcast presence.
    *   **Receiver** advertises a service type `_backup-wiz._tcp`.
    *   **Sender** browses for this service to find available receivers.
2.  **Handshake (New)**:
    *   Sender connects to Receiver via TCP.
    *   **Receiver** is prompted with an authorization window showing the Sender's hostname and OS.
    *   Handshake must be **Accepted** by the Receiver user before any data is exchanged.
3.  **Transfer & Visuals**:
    *   Data is chunked and streamed over the TCP socket.
    *   **Both machines** show real-time progress bars, file counts, and transfer speeds.
    *   Receiver reconstructs files in the restore directory with original hierarchy preserved.
4.  **Finalization**:
    *   Once transfer reaches 100%, the Receiver performs a finalization step (simulated unpacking and moving) to ensure data integrity and organization.
5.  **Cleanup**:
    *   If using the ephemeral script, the entire application directory is removed upon exit.

---

## ✨ Recent Updates (v1.2.0)

*   **Secure Handshake**: Added manual confirmation on the receiver machine for better security.
*   **Receiver Visuals**: Fixed bug where receiver side showed no status during transfer. Both sides now see full progress.
*   **Restore Organization**: Improved file restoration logic to maintain folder hierarchy and added a finalization phase.

---

## 📦 Dependencies

*   **Electron**: Desktop framework.
*   **React + Vite**: UI and Build tool.
*   **Bonjour-service**: mDNS implementation for Node.js.
*   **TailwindCSS**: Styling.
