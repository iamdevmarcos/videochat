export function renderAppShell(root: HTMLElement): void {
  root.innerHTML = `
    <div class="meet-app">
      <header class="meet-header hidden" id="meetHeader">
        <div class="meet-header-left">
          <span class="meet-logo"><i class="fa-solid fa-video"></i></span>
          <div class="meet-meta">
            <span class="meet-room" id="roomTitle">—</span>
            <span class="meet-status" id="statusBadge">Ready</span>
          </div>
        </div>
        <div class="meet-header-actions">
          <button type="button" class="btn-icon" id="settingsBtn" title="Settings">
            <i class="fa-solid fa-gear"></i>
          </button>
          <button type="button" class="btn-text" id="createLinkBtn" disabled>
            <i class="fa-solid fa-link"></i>
            Copy link
          </button>
        </div>
      </header>

      <main class="meet-main">
        <section class="lobby" id="lobby">
          <div class="lobby-card">
            <div class="lobby-icon">
              <i class="fa-solid fa-video"></i>
            </div>
            <h1>Video meetings for everyone</h1>
            <p>Connect, collaborate and celebrate from anywhere.</p>
            <button type="button" class="btn-primary" id="newCallBtn">
              <i class="fa-solid fa-plus"></i>
              New meeting
            </button>

            <div class="lobby-divider"><span>or</span></div>

            <div class="join-form">
              <input
                type="text"
                id="roomInput"
                class="join-input"
                placeholder="Enter a code or link"
                autocomplete="off"
                spellcheck="false"
              />
              <button type="button" class="btn-secondary" id="joinRoomBtn">Join</button>
            </div>
            <p class="join-error hidden" id="joinError">Invalid meeting code or link</p>

            <button type="button" class="btn-text lobby-settings-btn" id="lobbySettingsBtn">
              <i class="fa-solid fa-gear"></i>
              Audio &amp; video
            </button>
          </div>
        </section>

        <section class="video-stage hidden layout-spotlight" id="videoStage">
          <div class="video-layout" id="videoLayout" data-fit="cover">
            <div class="video-tile tile-remote" id="remoteTile">
              <video id="remoteVideo" class="tile-video" autoplay playsinline></video>
              <span class="tile-label" id="remoteLabel">Participant</span>
            </div>
            <div class="video-tile tile-local hidden" id="localTile">
              <video id="localVideo" class="tile-video" autoplay muted playsinline></video>
              <span class="tile-label">You</span>
            </div>
            <div class="video-tile tile-waiting hidden" id="waitingTile">
              <div class="avatar-ring">
                <i class="fa-solid fa-user-plus"></i>
              </div>
              <p id="waitingTileText">Waiting for others to join</p>
            </div>
          </div>

          <div class="video-placeholder hidden" id="videoPlaceholder">
            <div class="avatar-ring">
              <i class="fa-solid fa-user"></i>
            </div>
            <p id="placeholderText">Waiting for others to join</p>
          </div>

          <div class="video-float-controls" id="videoFloatControls">
            <button type="button" class="float-btn" id="fitBtn" title="Fill frame">
              <i class="fa-solid fa-crop-simple"></i>
              <span id="fitBtnLabel">Fill</span>
            </button>
          </div>
        </section>

        <div class="prejoin hidden" id="incomingOverlay">
          <div class="prejoin-card">
            <div class="prejoin-icon">
              <i class="fa-solid fa-users"></i>
            </div>
            <h2>Ready to join?</h2>
            <p id="incomingRoomLabel">Meeting</p>
            <div class="prejoin-actions">
              <button type="button" class="btn-secondary" id="declineBtn">Cancel</button>
              <button type="button" class="btn-primary" id="acceptBtn">Join now</button>
            </div>
          </div>
        </div>
      </main>

      <footer class="meet-controls hidden" id="meetControls">
        <div class="controls-bar">
          <button type="button" class="ctrl-btn" id="micBtn" title="Turn off microphone" disabled>
            <i class="fa-solid fa-microphone"></i>
          </button>
          <button type="button" class="ctrl-btn" id="cameraBtn" title="Turn off camera" disabled>
            <i class="fa-solid fa-video"></i>
          </button>
          <button type="button" class="ctrl-btn" id="volumeBtn" title="Mute speaker" disabled>
            <i class="fa-solid fa-volume-high"></i>
          </button>
          <button type="button" class="ctrl-btn" id="layoutBtn" title="Switch layout" disabled>
            <i class="fa-solid fa-table-columns"></i>
          </button>
          <button type="button" class="ctrl-btn" id="fullscreenBtn" title="Fullscreen" disabled>
            <i class="fa-solid fa-expand"></i>
          </button>
          <button type="button" class="ctrl-btn end-call" id="hangUpBtn" title="Leave call" disabled>
            <i class="fa-solid fa-phone-slash"></i>
          </button>
        </div>
      </footer>

      <aside class="settings-panel hidden" id="settingsPanel" aria-label="Settings">
        <div class="settings-header">
          <h3>Settings</h3>
          <button type="button" class="btn-icon" id="closeSettingsBtn" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="settings-body">
          <div class="setting-group">
            <label class="setting-label" for="cameraSelect">Camera</label>
            <select id="cameraSelect" class="setting-select">
              <option value="">Default camera</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label" for="micSelect">Microphone</label>
            <select id="micSelect" class="setting-select">
              <option value="">Default microphone</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label" for="layoutSelect">Layout</label>
            <select id="layoutSelect" class="setting-select">
              <option value="spotlight">Spotlight — main + small self view</option>
              <option value="split">Side by side — 50% each</option>
            </select>
          </div>

          <label class="setting-toggle">
            <span>Mirror my camera</span>
            <input type="checkbox" id="mirrorToggle" checked />
            <span class="toggle-track" aria-hidden="true"></span>
          </label>

          <label class="setting-toggle">
            <span>Show my video</span>
            <input type="checkbox" id="showSelfToggle" checked />
            <span class="toggle-track" aria-hidden="true"></span>
          </label>
        </div>
      </aside>

      <div class="settings-backdrop hidden" id="settingsBackdrop"></div>

      <p class="built-by">
        built by
        <a
          href="https://www.instagram.com/mendes.tsx/"
          target="_blank"
          rel="noopener noreferrer"
        >Marcos Mendes</a>
      </p>
    </div>
  `
}
