// Universal 3-Way Agent Sync Script
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function syncDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      syncDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('🔄 Đang đồng bộ Rules, Recipes và Hooks giữa Antigravity, Claude và ChatGPT...');

// Sync Rules
syncDir(path.join(root, '.agents/rules'), path.join(root, '.claude/rules'));

// Sync Recipes
syncDir(path.join(root, '.agents/recipes'), path.join(root, '.claude/recipes'));

// Sync Hooks
syncDir(path.join(root, '.agents/hooks'), path.join(root, '.claude/hooks'));

// Convert Skills to Claude Commands
const skillsDir = path.join(root, '.agents/skills');
const commandsDir = path.join(root, '.claude/commands');
if (fs.existsSync(skillsDir)) {
  if (!fs.existsSync(commandsDir)) fs.mkdirSync(commandsDir, { recursive: true });
  const skills = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const s of skills) {
    if (s.isDirectory()) {
      const skillFile = path.join(skillsDir, s.name, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        const cmdFile = path.join(commandsDir, `${s.name}.md`);
        fs.copyFileSync(skillFile, cmdFile);
      }
    }
  }
}

console.log('✅ Đồng bộ hoàn tất 100%!');
