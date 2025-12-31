# 🎮 Catch Master – Game Hứng Bóng

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

## 🛠 Changelogs and Updates

### 🚀 Catch Master v1.0.4

#### 🌟 Improvements
- **Remastered Intro:** Enhanced opening sequence for a more polished experience.
- **Score Mechanic Restructure:** Introduced a new multiplier system to reward high-risk gameplay.
- **Data Persistence Update:** The system now tracks the **Top 20** best scores per combination instead of just a single high score.

#### 📈 New Multiplier System
Your final score is now calculated using the following formula:
`Final Score = Base Score × Difficulty Multiplier × Modifier Multiplier × Funny Bonus`

**1. Base Multipliers**
| Category | Type | Multiplier |
| :--- | :--- | :--- |
| **Difficulty** | Normal | 1.0x |
| | Hardcode | 1.5x |
| | Sudden Death | 2.0x |
| **Game Type** | Default / Classic | 1.0x |

**2. Modifier Multipliers (Stackable)**
Adding gameplay modifiers increases your score potential:
* **None:** 1.0x
* **Hidden (h):** 1.1x
* **Blank (b):** 1.2x
* **Reverse (r):** 1.3x
* **Combo (h + b + r):** Up to **1.7x**

**3. Funny Mode Bonus**
* Enabling **Funny Modes** (Reverse Control, Mirror, or Invisible) now grants a **1.1x** global bonus to the final score.

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

## 🎮 Main Gameplay

### ⚡ Quick Play
Chọn nhanh các chế độ chơi mặc định để bắt đầu ngay lập tức.

#### 🟢 Normal Mode
- **5 lives**
- Beginner-friendly
- Includes healing, shields, and slow-motion effects

#### 🔴 Hardcore Mode
- **1 life only**
- No forgiveness
- Bombs can cause **instant death**
- Requires strong reflexes and prediction

#### 🔴 Sudden Death Mode
- **1 life only**
- No forgiveness: Missing any ball (except bomb ball) = **Game Over**
- Bombs can cause **instant death**
- Requires extreme precision

#### 🟣 Classic Mode
- Reduced ball variety
- Pure arcade experience
- Focus on precision and combo timing

---

### 🧪 Custom Play
Chế độ tùy chỉnh hoàn toàn theo ý thích, lý tưởng để thử nghiệm hoặc tạo ra các thử thách "không tưởng".

**Basic Settings:**
- Game Rules: Normal / Hardcore
- Auto-play: On / Off
- Enabled ball types: (Tùy chọn danh sách bóng xuất hiện)

**Modifiers:**
- **Hidden ball:** Ball becomes hidden after spawning.
- **Blank:** A blank space will get you stuck.
- **Reverse gravity:** Everything falls upward.

**Funny Modifiers:**
- **Reverse control:** Left becomes right, right becomes left.
- **Mirror:** Your position is flipped to the top.
- **Invisible:** Your character/paddle becomes invisible.

## 🎯 Ball Types

| Color | Type | Effect |
|------|------|--------|
| 🔴 Red | Normal | +1 score |
| 🟣 Purple | Fast | +3 score, normal mode only|
| 🟡 Yellow | Sine | +10 score, wave movement, normal mode only |
| 🟢 Green | Heal | +1 life, not avalaible on Hardcode mode |
| 🔵 Blue | Boost | Increases paddle width, normal mode only |
| ⚪ White | Snow | Slows down time, normal mode only |
| ⚫ Gray | Shield | Blocks one mistake, |
| 🟠 Orange | Bomb | Lose life / instant death (Hardcore), normal mode only |

> You can custom ball play on Custom mode
> At higher scores, multiple bombs may appear simultaneously.

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

## 🤖 Auto Mode (Bot)

- AI-controlled paddle
- Predicts ball trajectories
- Avoids bombs intelligently
- Handles sine-wave movement and wall bounces

Useful for Casual or idle play, relaxing

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

## 💾 Data Persistence

- **Score History:** The system tracks a list of the **20 score recent** for each specific game mode combination.
- **Tracking Categories:** Scores are categorized based on:
  - **Difficulty:** Normal, Hardcore, or Sudden Death.
  - **Game Type:** Default or Classic.
  - **Modifiers:** Combinations of Hidden, Blank, and Reverse Gravity.
- **Storage:** All data is saved locally via `localStorage`.
- **Privacy:** No account or login required.
- **Unique Keys:** Storage keys are dynamically generated to ensure consistent record-keeping (e.g., `best_score_hardcode_classic_h_b_r`).

---

### 3. Funny Mode Bonus
* Enabling any "Funny Mode" (Reverse Control, Mirror, or Invisible) grants an additional **1.1x** global bonus to your score.

> **Formula:**
> `Final Score` = `Base Score` × `Difficulty Multiplier` × `Modifiers Multiplier` × `Funny Bonus`

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
