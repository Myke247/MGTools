# MGTools Notification System - Complete Analysis & Fix Plan

## Problem Statement
Pet ability notifications are not respecting custom uploaded sounds. Even when users upload custom ability sounds, the system plays the default beep sounds selected from the dropdown instead.

---

## How The Notification System SHOULD Work

### Architecture Overview
MGTools has a two-tier notification sound system:

1. **Custom Sounds (Priority 1)** - User-uploaded audio files stored via `GM_setValue`
2. **Default Sounds (Priority 2)** - Built-in beep/chime sounds selected from dropdowns

The system provides wrapper functions that implement this priority logic:
```javascript
function playCustomOrDefaultSound(soundType, defaultPlayFunc, volume) {
  const customSound = GM_getValue(`mgtools_custom_sound_${soundType}`, null);
  if (customSound) {
    // Play custom uploaded sound
    const audio = new Audio(customSound);
    audio.volume = volume;
    audio.play();
  } else {
    // Fall back to default beep function
    defaultPlayFunc(volume);
  }
}
```

### Notification Categories
There are 4 sound categories with wrapper functions:

| Category | Wrapper Function | Custom Sound Key | Used For |
|----------|-----------------|------------------|----------|
| Shop | `playShopNotificationSound()` | `mgtools_custom_sound_shop` | Rare seeds/eggs in shop |
| Pet Hunger | `playPetNotificationSound()` | `mgtools_custom_sound_pet` | Pet hunger warnings |
| Ability | `playAbilityNotificationSound()` | `mgtools_custom_sound_ability` | Pet ability triggers |
| Weather | `playWeatherNotificationSound()` | `mgtools_custom_sound_weather` | Weather events |

---

## The Bug: Ability Notifications Bypass Custom Sounds

### Code Location: `MGTools.user.js:25087-25118`

**Current Implementation (BROKEN):**
```javascript
// Play ability notification sound based on settings
const abilityVolume = UnifiedState.data.settings.notifications.abilityNotificationVolume || 0.2;
const abilitySound = UnifiedState.data.settings.notifications.abilityNotificationSound || 'single';

switch (abilitySound) {
  case 'single':
    playSingleBeepNotification(abilityVolume);  // ❌ Direct call bypasses custom sound
    break;
  case 'double':
    playDoubleBeepNotification(abilityVolume);  // ❌ Direct call bypasses custom sound
    break;
  case 'triple':
    playTripleBeepNotification(abilityVolume);  // ❌ Direct call bypasses custom sound
    break;
  // ... etc for all 8 sound types
  default:
    playSingleBeepNotification(abilityVolume);
}
```

**Why This Is Wrong:**
- Directly calls beep functions (e.g., `playSingleBeepNotification`)
- Never checks for custom uploaded sounds
- Ignores `playAbilityNotificationSound()` wrapper function

### Evidence

**Shop notifications work correctly** (`MGTools.user.js:15721`):
```javascript
playShopNotificationSound(volume);  // ✅ Uses wrapper - checks custom sound first
```

**Pet hunger notifications work correctly** (`MGTools.user.js:16094`):
```javascript
playPetNotificationSound(volume);  // ✅ Uses wrapper - checks custom sound first
```

**Ability notifications are broken** (`MGTools.user.js:25093`):
```javascript
playSingleBeepNotification(abilityVolume);  // ❌ Bypasses wrapper - ignores custom sound
```

---

## Additional Issue: Incomplete Wrapper Function

### Code Location: `MGTools.user.js:14732-14733`

The `playAbilityNotificationSound` wrapper exists but has a flaw:

```javascript
function playAbilityNotificationSound(volume) {
  playCustomOrDefaultSound('ability', playSingleBeepNotification, volume);
}
```

**Problem:** When there's no custom sound, it ALWAYS falls back to `playSingleBeepNotification`, ignoring the user's dropdown selection (`abilityNotificationSound` setting).

**Expected Behavior:**
- If custom sound exists → play custom sound
- If no custom sound → play the sound selected in "Ability Notification Sound" dropdown (single/double/triple/chime/etc.)

---

## The Fix: Two-Part Solution

### Part 1: Make Ability Notifications Use the Wrapper Function

**Location:** `MGTools.user.js:25087-25118`

**REPLACE:**
```javascript
const abilityVolume = UnifiedState.data.settings.notifications.abilityNotificationVolume || 0.2;
const abilitySound = UnifiedState.data.settings.notifications.abilityNotificationSound || 'single';

switch (abilitySound) {
  case 'single':
    playSingleBeepNotification(abilityVolume);
    break;
  // ... (entire switch statement)
}
```

**WITH:**
```javascript
const abilityVolume = UnifiedState.data.settings.notifications.abilityNotificationVolume || 0.2;
playAbilityNotificationSound(abilityVolume);
```

### Part 2: Fix the Wrapper Function to Respect Dropdown Selection

**Location:** `MGTools.user.js:14732-14733`

**REPLACE:**
```javascript
function playAbilityNotificationSound(volume) {
  playCustomOrDefaultSound('ability', playSingleBeepNotification, volume);
}
```

**WITH:**
```javascript
function playAbilityNotificationSound(volume) {
  const customSound = GM_getValue('mgtools_custom_sound_ability', null);
  if (customSound) {
    try {
      const audio = new Audio(customSound);
      audio.volume = volume || 0.2;
      audio.play();
      productionLog('🎵 [CUSTOM-SOUND] Playing custom ability sound');
    } catch (err) {
      console.error('Failed to play custom ability sound:', err);
      // Fall through to default sound logic
    }
  }

  // If no custom sound or custom sound failed, use user's selected default
  if (!customSound) {
    const abilitySound = UnifiedState.data.settings.notifications.abilityNotificationSound || 'single';

    switch (abilitySound) {
      case 'single':
        playSingleBeepNotification(volume);
        break;
      case 'double':
        playDoubleBeepNotification(volume);
        break;
      case 'triple':
        playTripleBeepNotification(volume);
        break;
      case 'chime':
        playChimeNotification(volume);
        break;
      case 'alert':
        playAlertNotification(volume);
        break;
      case 'buzz':
        playBuzzNotification(volume);
        break;
      case 'ding':
        playDingNotification(volume);
        break;
      case 'chirp':
        playChirpNotification(volume);
        break;
      case 'epic':
        playEpicNotification(volume);
        break;
      default:
        playSingleBeepNotification(volume);
    }
  }
}
```

### Part 3 (Optional): Add "Epic" Option to Ability Notification Dropdown

**Location:** `MGTools.user.js:17163` (after "chirp" option)

**ADD:**
```javascript
<option value="epic" ${settings.notifications.abilityNotificationSound === 'epic' ? 'selected' : ''}>🎵 Epic Fanfare</option>
```

---

## Testing Plan

After implementing the fix:

1. **Test Custom Sound Priority:**
   - Upload a custom ability sound in Settings
   - Trigger a pet ability
   - **Expected:** Custom sound plays (not dropdown selection)

2. **Test Dropdown Fallback:**
   - Delete custom ability sound
   - Select "Triple Beep" from dropdown
   - Trigger a pet ability
   - **Expected:** Triple beep plays

3. **Test All Dropdown Options:**
   - For each option (single/double/triple/chime/alert/buzz/ding/chirp/epic)
   - Trigger ability with no custom sound
   - **Expected:** Selected sound plays

4. **Test Other Categories Still Work:**
   - Shop notifications should still respect custom shop sounds
   - Pet hunger should still respect custom pet sounds
   - **Expected:** No regression in shop/pet sound system

---

## Related Code References

### Wrapper Function Definitions
- `playCustomOrDefaultSound()` - Line 14707
- `playShopNotificationSound()` - Line 14724
- `playPetNotificationSound()` - Line 14728
- `playAbilityNotificationSound()` - Line 14732 (NEEDS FIX)
- `playWeatherNotificationSound()` - Line 14736

### Custom Sound Upload UI
- Upload handler - Line 22131
- Test button - Line 22157
- Delete button - Line 22169

### Notification Triggers
- Shop detection - Line 15721 (✅ Uses wrapper)
- Pet hunger - Line 16094 (✅ Uses wrapper)
- Ability trigger - Line 25091 (❌ Bypasses wrapper - THE BUG)

### Sound Function Implementations
- `playSingleBeepNotification()` - Line 14576
- `playDoubleBeepNotification()` - Line 14581
- `playTripleBeepNotification()` - Line 14563
- `playChimeNotification()` - Line 14586
- `playAlertNotification()` - Line 14595
- `playBuzzNotification()` - Line 14607
- `playDingNotification()` - Line 14619
- `playChirpNotification()` - Line 14624
- `playEpicNotification()` - Line 14647

---

## Summary

**Root Cause:** Ability notifications call beep functions directly instead of using the `playAbilityNotificationSound()` wrapper that checks for custom sounds.

**Impact:** Users cannot use custom uploaded sounds for ability notifications, even though the UI allows uploading them.

**Fix Complexity:** Low - Replace ~30 lines of switch statement with 1 function call, then enhance the wrapper function to respect dropdown settings.

**Risk:** Very low - Other notification categories use same pattern successfully.

---

## Implementation Checklist

- [ ] Update `playAbilityNotificationSound()` wrapper function (line 14732)
- [ ] Replace ability notification switch statement with wrapper call (line 25091)
- [ ] Add "epic" option to ability dropdown (line 17163) - OPTIONAL
- [ ] Test custom sound upload for abilities
- [ ] Test dropdown selection fallback
- [ ] Test all 8-9 sound options
- [ ] Verify no regression in shop/pet notifications
- [ ] Run Prettier
- [ ] Commit with message: "Fix ability notifications to respect custom sounds"

---

*Generated: 2025-10-21*
*For: MGTools v3.9.3 (Live-Beta)*
