const default_options = {
  background: false,
};

browser.commands.onCommand.addListener(async command => {
  if (command == 'duplicate-tab') {
    const options = await browser.storage.sync.get(default_options);
    const tabs = await browser.tabs.query({
      currentWindow: true,
      highlighted: true,
    });
    if (tabs.length === 1) {
      // Handle the simple case with a single tab separately
      const tab = tabs[0];
      const newTab = await browser.tabs.duplicate(tab.id);
      if (tab.pinned) {
        // Firefox only:
        await browser.tabs.update(newTab.id, { pinned: true });
        await browser.tabs.move(newTab.id, { index: tab.index + 1 });
      }
      if (options.background) {
        // Focus the old tab
        await browser.tabs.update(tab.id, { active: true });
      }
    } else {
      const pinnedTabs = tabs.filter(t => t.pinned);
      const lastPinnedTab = pinnedTabs[pinnedTabs.length - 1];
      const lastTab = tabs[tabs.length - 1];
      const newTabs = [];
      let pinnedIndex = 0;
      let index = 0;
      let tabToActivate;
      let tabToDeactivate;
      for (const tab of tabs) {
        const newTab = await browser.tabs.duplicate(tab.id);
        newTabs.push(newTab);
        let newIndex;
        if (tab.pinned) {
          await browser.tabs.update(newTab.id, { pinned: true }); // Firefox only
          newIndex = lastPinnedTab.index + pinnedIndex + 1;
          pinnedIndex++;
        } else {
          newIndex = pinnedTabs.length + lastTab.index + index + 1;
          index++;
        }
        await browser.tabs.move(newTab.id, { index: newIndex });
        if (tab.active) {
          tabToActivate = options.background ? tab : newTab;
        }
        if (options.background) {
          tabToDeactivate = newTab;
        }
      }
      for (const tab of options.background ? tabs : newTabs) {
        await browser.tabs.update(tab.id, { highlighted: true });
      }
      if (tabToDeactivate) {
        await browser.tabs.update(tabToDeactivate.id, { highlighted: false });
      }
      await browser.tabs.update(tabToActivate.id, { highlighted: false });
      await browser.tabs.update(tabToActivate.id, { highlighted: true });
    }
  } else if (command == 'toggle-pinned-tab') {
    const tabs = await browser.tabs.query({
      currentWindow: true,
      active: true,
    });
    if (tabs.length === 1) {
      const tab = tabs[0];
      if (tab.pinned) {
        await browser.tabs.update(tab.id, { pinned: false });
      } else {
        await browser.tabs.update(tab.id, { pinned: true });
      }
    } else {
      for (const tab of tabs) {
        if (tab.pinned) {
          await browser.tabs.update(tab.id, { pinned: false });
        } else {
          await browser.tabs.update(tab.id, { pinned: true });
        }
      }
    }
  }
});
