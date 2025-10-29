              initializeInstantFeedButtons: () => {
                // REAL PET_FEED_CATALOG from Magic Garden/Magic Circle (Live-Beta line 31087)
                const PET_FEED_CATALOG = {
                  Worm: ['Carrot', 'Strawberry', 'Aloe', 'Tomato', 'Apple'],
                  Snail: ['Blueberry', 'Tomato', 'Corn', 'Daffodil'],
                  Bee: ['Strawberry', 'Blueberry', 'OrangeTulip', 'Daffodil', 'Lily'],
                  Chicken: ['Aloe', 'Corn', 'Watermelon', 'Pumpkin'],
                  Bunny: ['Carrot', 'Strawberry', 'Blueberry', 'Echeveria'],
                  Dragonfly: ['Apple', 'OrangeTulip', 'Echeveria'],
                  Pig: ['Watermelon', 'Pumpkin', 'Mushroom', 'Bamboo'],
                  Cow: ['Coconut', 'Banana', 'BurrosTail', 'Mushroom'],
                  Squirrel: ['Pumpkin', 'Banana', 'Grape'],
                  Turtle: ['Watermelon', 'BurrosTail', 'Bamboo', 'Pepper'],
                  Goat: ['Pumpkin', 'Coconut', 'Cactus', 'Pepper'],
                  Butterfly: ['Daffodil', 'Lily', 'Grape', 'Lemon', 'Sunflower'],
                  Capybara: ['Lemon', 'PassionFruit', 'DragonFruit', 'Lychee'],
                  Peacock: ['Cactus', 'Sunflower', 'Lychee'],
                  Copycat: []
                };

                // Create shared state for used crop IDs
                const usedCropIds = new Set();

                // getAtomValue helper (used by readMyPetSlots and handleInstantFeed)
                const getAtomValue = (atomName) => {
                  try {
                    const store = RuntimeUtilities.captureJotaiStore({ targetWindow: targetWin, productionLog });
                    if (store && store.get) {
                      const atom = targetWin.jotaiAtomCache?.get?.(atomName);
                      if (atom) {
                        return store.get(atom);
                      }
                    }
                  } catch (e) {
                    // Silent fail, fallback to other methods
                  }
                  return null;
                };

                // readMyPetSlots function (from Live-Beta line 6838)
                const readMyPetSlots = () => {
                  try {
                    return getAtomValue('myPetSlotInfosAtom');
                  } catch {
                    /* atom unavailable */
                  }
                  return UnifiedState.UnifiedState?.atoms?.activePets ?? null;
                };

                // Create bound handleInstantFeed with all dependencies
                const boundHandleInstantFeed = (petIndex, buttonEl) => {
                  return Pets.handleInstantFeed(petIndex, buttonEl, {
                    targetWindow: targetWin,
                    UnifiedState: UnifiedState.UnifiedState,
                    getAtomValue,
                    readAtom: (atomName) => RuntimeUtilities.readAtom(atomName, { targetWindow: targetWin }),
                    readMyPetSlots,
                    PET_FEED_CATALOG,
                    sendFeedPet: Pets.sendFeedPet,
                    feedPetEnsureSync: Pets.feedPetEnsureSync,
                    flashButton: Pets.flashButton,
                    usedCropIds
                  });
                };

                // Initialize with all dependencies
                Pets.initializeInstantFeedButtons({
                  targetDocument: document,
                  targetWindow: targetWin,
                  UnifiedState: UnifiedState.UnifiedState,
                  handleInstantFeed: boundHandleInstantFeed,
                  captureJotaiStore: () => RuntimeUtilities.captureJotaiStore({ targetWindow: targetWin, productionLog }),
                  productionLog
                });
              },
