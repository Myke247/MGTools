# 🚀 HOW TO PUSH UPDATES TO USERS

## Quick Checklist
- [ ] Edit `MGTools.user.js`
- [ ] Change `@version` number (line 4)
- [ ] Update `CHANGELOG.md` with changes
- [ ] Run the 3 git commands below
- [ ] Users get updates automatically!

---

## Step-by-Step Instructions

### 1. Edit the Script
Edit `MGTools.user.js` in your code editor

### 2. Update Version Number (REQUIRED!)
Open `MGTools.user.js` and change line 4:
```javascript
// @version      2.1.8   ← Change this number
// @version      2.1.9   ← Increment it
```

**Version numbering:**
- Bug fixes: `2.1.8` → `2.1.9`
- New features: `2.1.9` → `2.2.0`
- Major changes: `2.2.0` → `3.0.0`

### 3. Update CHANGELOG.md
Add your changes at the top of `CHANGELOG.md`

### 4. Push to GitHub
Run these 3 commands in your terminal:

```bash
cd C:/Users/MLvP3/ClaudeProjectRepo
git add MGTools.user.js CHANGELOG.md
git commit -m "v2.1.9 - Your description here"
git push origin main
```

### 5. Done! ✅
- GitHub updates instantly
- Users get notified within hours
- They click "Update" and get the new version

---

## User Install Link (For Sharing)
```
https://github.com/Myke247/MGTools/raw/refs/heads/main/MGTools.user.js
```

Users click this link → Tampermonkey opens → Click "Install" → Done!

---

## Important Notes

⚠️ **ALWAYS change the `@version` number!** If you don't, users won't see the update.

⚠️ **Test before pushing!** Make sure it works locally first.

✅ **Updates are automatic** - Users don't need to reinstall or click the link again.

✅ **Most users get updates within 1-6 hours** after you push.

---

## Quick Update Template

```bash
# 1. Edit MGTools.user.js
# 2. Change @version to 2.1.9
# 3. Update CHANGELOG.md
# 4. Run:

git add MGTools.user.js CHANGELOG.md
git commit -m "v2.1.9 - Fixed bug XYZ"
git push origin main
```

---

**Remember: Version number → Git push → Users get it automatically!** 🎉
