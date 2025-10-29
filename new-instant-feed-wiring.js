              initializeInstantFeedButtons: () => {
                // Create shared state for used crop IDs
                const usedCropIds = new Set();

                // Define PET_FEED_CATALOG (pet species -> compatible crops mapping)
                // This is a simple mapping - actual data should match game's pet feeding system
                const PET_FEED_CATALOG = {
                  Rabbit: ['Carrot', 'Lettuce', 'Cabbage'],
                  Cat: ['Fish', 'Milk'],
                  Dog: ['Bone', 'Meat'],
                  // Add more as needed - for now using placeholder data
                };

                // Create readMyPetSlots function
                const readMyPetSlots = () => {
                  try {
                    return UnifiedState.UnifiedState.atoms?.activePets || [];
                  } catch (e) {
                    return [];
                  }
                };

                // Create getAtomValue function
                const getAtomValue = async (atomName) => {
                  try {
                    const store = RuntimeUtilities.captureJotaiStore({ targetWindow: targetWin, productionLog });
                    if (store && store.get) {
                      const atom = targetWin.jotaiAtomCache?.get?.(atomName);
                      if (atom) {
                        return await store.get(atom);
                      }
                    }
                  } catch (e) {
                    productionLog('[Feed] getAtomValue failed:', e);
                  }
                  return null;
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
