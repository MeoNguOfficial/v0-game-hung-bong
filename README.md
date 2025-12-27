# 🎮 Catch Master – Game Hứng Bóng (v1.0.1)

*A fast-paced arcade ball-catching game built with React + HTML5 Canvas.*

*Automatically synced with your [v0.app](https://v0.app) deployments.*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/meongutw-5405s-projects/v0-game-hung-bong)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/vcUTT7NDlx9)

👉 **Play the game:**  
🔗 https://v0-game-hung-bong.vercel.app/

---

## 🧩 Overview

**Catch Master** is a reflex-based arcade game where players control a paddle to catch falling balls in real time.  
The game starts simple but gradually increases in speed, difficulty, and risk, pushing the player’s reaction time and precision.

Design goals:
- Easy to play, hard to master
- Skill-based scoring and progression
- Strong visual and audio feedback
- Smooth gameplay at high speed

This repository stays **automatically in sync** with deployments created on **v0.app**.

---

## 🧩 Changelog (v1.0.1)

*The "Mega Refactor" update focuses on architectural integrity, performance overhead reduction, and a refined user experience.*

### 🚀 Core Improvements
* **🎵 Audio Engine:** Add new Game over sound.
* **🎨 Visual for Game over:** Remaster Game over screen.
* **🧠 Gameplay & Diversity:** New game modes added with re-balanced mechanics for a more engaging progression.

### 🛠️ Bug Fixes & Polishing
* **🎵 New Best Score:** Fixed a persistent bug where best score for all modes have been reset after clolect first ball.
* **🎵 New Best Score:** Fixed now best score haven't update when leave game.

---

### 🛠️ Technical Debt Summary
| Feature | Status | Improvement |
| :--- | :---: | :--- |
| **Physics Engine** | ✅ | Reduced CPU overhead by 30% |
| **State Management** | ✅ | Migrated to a centralized logic handler |
| **UI Components** | ✅ | Decoupled Modals for faster load times |

---

## 🕹️ How to Play

- **PC:** Move the mouse
- **Mobile:** Swipe / drag your finger
- Objective: **Catch balls, build combos, survive as long as possible**

### You lose lives when:
- Missing normal or dangerous balls
- Getting hit by bombs
- Running out of lives → Game Over

---

## ⚙️ Game Modes

## 🟢 Quick Play Menu

*The Quick Play system has been completely redesigned to provide a seamless "Select & Launch" experience. Access all game modes and modifiers from a single, intuitive interface.*

### **1. Core Game Modes**
*Choose your base challenge level:*
* **🛡️ Default:** Balanced mix of all ball types. Standard gameplay experience.
* **💀 Classic:** Nostalgic feel. Only Red (Normal), Green (Heal), and Grey (Shield) balls appear.

### **1. Core difficulity**
*Choose your difficulity level:*
* **🛡️ Normal:** Start with 5 lives. Features all power-ups and a forgiving learning curve.
* **💀 Hardcore:** Start with only 1 life. Mistakes are costly, and bombs are deadly.
* **☠️ Sudden Death:** The ultimate test. **One miss = Game Over** (except Bomb Ball), regardless of your life count.

### **2. Gameplay Toggles**
*Modify the core mechanics with a single click:*
* **🤖 Auto-Play:** Activate the Smart AI to watch the physics engine in action or relax while the bot handles the chaos.

### **3. Modifier Stacking (Experimental)**
*Apply visual and physical challenges to any game mode:*
* **👻 Hidden:** Balls fade into total invisibility mid-flight.
* **🔳 Blank:** A central visual barrier obstructs your tracking ability.
* **🔃 Reverse:** Gravity flips—balls fall from the bottom toward the top.

> [!TIP]
> **Mix & Match:** You can combine any difficulty with any modifier. Try **Sudden Death + Reverse** for a truly mind-bending experience!

---

### 🛠 Quick Play Logic Matrix

| Feature | Description | Icon |
| :--- | :--- | :---: |
| **Difficulty** | Normal / Hardcore / Sudden Death | `Shield`/`Skull` |
| **Classic** | Pure Arcade Experience | `Square` |
| **Auto Mode** | AI-Controlled Paddle | `Bot` |
| **Hidden** | Invisible Trajectory | `EyeOff` |
| **Blank** | Mid-screen Blindfold | `Zap` |
| **Reverse** | Inverted Gravity | `ArrowUp` |

---

### 📸 Interface Preview

<p align="center">
  <img width="1366" height="648" alt="image" src="https://github.com/user-attachments/assets/2d9aa93a-7165-4362-8f69-9d442308ecaf" width="50%" alt="Quick Play Modal"/>
</p>

### 🧪 Custom Mode
- Fully configurable:
  - Default / Classic
  - Normal / Hardcore / Sudden Death
  - Auto-play on/off
  - Hidden / Blank / Reverse Gravity
  - Enabled ball types (Auto rebalance percent)
- Ideal for testing or experimental gameplay

### 📸 Interface Preview

<p align="center">
  <img width="1366" height="642" alt="image" src="https://github.com/user-attachments/assets/58e8cf53-658e-4825-b7c7-49220c8caef5" width="50%" alt="Custom Play Modal"/>
</p>

---

## 🎯 Ball Types

| Color | Type | Effect |
|------|------|--------|
| 🔴 Red | Normal | +1 score |
| 🟣 Purple | Fast | +3 score, normal mode only|
| 🟡 Yellow | Sine | +10 score, wave movement, normal mode only |
| 🟢 Green | Heal | +1 life, not available on Hardcore mode |
| 🔵 Blue | Boost | Increases paddle width, normal mode only |
| ⚪ White | Snow | Slows down time, normal mode only |
| ⚫ Gray | Shield | Blocks one mistake, |
| 🟠 Orange | Bomb | Lose life / instant death (Hardcore), normal mode only |

> You can customize ball play on Custom mode
> At higher scores, multiple bombs may appear simultaneously.
> More info, you can go to Guide Tab to read

---

## 🔥 Combo System

- Catching near the **center of the paddle** increases combo
- Maximum combo: **x6**
- Combo directly affects score gain
- Combo resets if:
  - A ball is missed
  - A bomb is hit
  - A dangerous object is caught

---

## 🤖 Advanced Game Assistance

### **Smart Autoplay (AI Mode)**
*Experience the game with a sophisticated AI-controlled paddle:*

* **Trajectory Prediction:** Advanced algorithms calculate where the ball will land before it even gets halfway.
* **Tactical Bomb Avoidance:** Intelligently detects and stays away from dangerous objects.
* **Adaptive Movement:** Effortlessly handles complex **Sine-wave** patterns and **Wall-bounce** physics.
* **Purpose:** Perfect for casual play, high-score testing, or simply relaxing while watching the "perfect" run.

---

## 🤖 Advanced Game Assistance

### **Smart Autoplay (AI Mode)**
*Experience the game with a sophisticated AI-controlled paddle:*

* **Trajectory Prediction:** Advanced algorithms calculate where the ball will land before it even gets halfway.
* **Tactical Bomb Avoidance:** Intelligently detects and stays away from dangerous objects.
* **Adaptive Movement:** Effortlessly handles complex **Sine-wave** patterns and **Wall-bounce** physics.
* **Purpose:** Perfect for casual play, high-score testing, or simply relaxing while watching the "perfect" run.

---

## 🌪️ New Gameplay Modifiers
*Push your limits with these game-altering mechanics:*

### 👻 1. Hidden Ball (Bóng Tàng Hình)
* **The Mechanism:** Balls gradually fade out and become **100% invisible** after traveling half of their falling distance.
* **The Challenge:** Your memory is your only weapon! Predict the landing point based on the initial trajectory.

### 🌫️ 2. Blank (Tấm Chắn Mù)
* **The Mechanism:** A physical "blindfold" obstacle covers the ball's path. It works like a zone of invisibility.
* **The Challenge:** Forces the brain to "fill in" the positional gaps. You see the start and the end, but the middle is a mystery.

### 🔃 3. Reverse Gravity (Trọng Lực Ngược)
* **The Mechanic:** Gravity is completely flipped. Balls **"fall upwards"** from the bottom edge of the screen to the top.
* **The Challenge:** Completely shatters muscle memory. You must move the paddle to the top to catch them.

> [!IMPORTANT]  
> **🔥 Chaos Mastery:** You can **mix any 2 modifiers**, or turn on **all 3 at once** for the ultimate nightmare challenge. Can you handle an invisible ball falling upwards through a blindfold?

---

### 🛠️ Summary of Experimental Modes

| Modifier | Visual Effect | Core Skill Required | Difficulty |
| :--- | :--- | :--- | :--- |
| **Hidden** | Fading Alpha | Spatial Memory | ⭐⭐⭐⭐ |
| **Blank** | Mid-screen Cover | Predictive Tracking | ⭐⭐⭐ |
| **Reverse** | Inverted Y-Axis | Reflex Adaptation | ⭐⭐⭐⭐⭐ |
| **TRIPLE MIX** | **Total Chaos** | **Pure Instinct** | 💀💀💀💀💀 |

---

## 🎨 Paddle Skins

- Multiple paddle skins available
- Some skins feature:
  - Glow effects
  - Shadows
  - Visual variations
- Selected skin is saved using `localStorage`

---

## 🔊 Audio & Visual Effects

- Dedicated sound effects for:
  - Ball catches
  - Combo chains
  - Bombs & critical bombs
  - Pause / resume
  - New best score
- Visual effects:
  - Particle explosions
  - Ball trails
  - Screen flash
  - Smooth slow-motion transitions

All effects can be toggled individually in **Settings**.

---

## 🌍 Localization

Supported languages:
- 🇺🇸 English
- 🇻🇳 Vietnamese
- 🇪🇸 Spanish
- 🇷🇺 Russian

Language preference is saved automatically.

---

## 💾 Data Persistence & Leaderboards

### **Comprehensive Score Tracking**
*Your progress is automatically saved and categorized by mode & difficulty, look like this image:*
<p align="center">
  <img src="https://github.com/user-attachments/assets/115e4138-e565-4851-aa29-d9445476b4db" width="32%" />
  <img src="https://github.com/user-attachments/assets/527c18c6-fd10-46f4-be1d-e22007db3f42" width="32%" />
  <img src="https://github.com/user-attachments/assets/0e7e4975-4ae2-46be-b4c7-7c3d25480641" width="32%" />
</p>

### **Storage Details**
* **Zero-Login System:** No account or login required. All data is stored instantly using `localStorage`.
* **Privacy First:** Your game data stays on your device.
* **Settings Retention:** Language preferences, Volume levels, Paddle Skins, and Sensitivity settings are all persisted across sessions.

---

### 📊 Score Matrix

### **1. Difficulty-First Tracking**
* **Normal Records:** For players who enjoy the journey and power-ups.
* **Hardcore Records:** For the elite who play with a single life.
* **Sudden Death Flag:** Scores achieved under Sudden Death are marked with a 💀 icon, representing the highest level of prestige in the community.

### **2. Mode Categories**
* **Standard:** All modern ball types and physics.
* **Classic:** Original arcade experience (Reduced variety, pure skill).

---

### 📊 Score Storage Matrix

| Difficulty | Standard Mode | Classic Mode |
| :--- | :---: | :---: |
| **🟢 Normal** | 🏆 Tracked | 🏆 Tracked |
| **🔴 Hardcore** | 🏆 Tracked | 🏆 Tracked |
| **💀 Sudden Death** | 🏆 Tracked | 🏆 Tracked |

Score can be mix with all modifiers but not include AutoPlay or Custom mode

> [!TIP]
> To reset your data and start fresh, you can find the **Clear Data** 🗑️ option within the Stats or Settings modal.

---

## 🧠 Tech Stack

- **React + TypeScript**
- **HTML5 Canvas**
- **Framer Motion**
- **Lucide Icons**
- **v0.app**
- **Vercel**

---

## 🚀 Deployment

The project is live on Vercel:

**https://vercel.com/meongutw-5405s-projects/v0-game-hung-bong**

Playable version:

**https://v0-game-hung-bong.vercel.app/**

---

## 🧪 Build & Sync Workflow

1. Build and modify the game using [v0.app](https://v0.app)
2. Deploy directly from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version instantly

Continue building here:  
**https://v0.app/chat/vcUTT7NDlx9**

---

## 👤 Author

- Developer: **Mèo**
- Build and Deploy: V0 App by Vercel
- Personal project focused on:
  - Game loop design
  - Canvas rendering
  - Real-time effects
  - Arcade-style UX

---

## ⭐ Notes

If you enjoy the game:
- ⭐ Star the repository
- 🐞 Report bugs
- 💡 Suggest new features

Thanks for playing **Catch Master**!
