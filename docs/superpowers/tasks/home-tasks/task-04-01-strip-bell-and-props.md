# Task 04-01: Strip bell props and handler from DashboardHeader

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Remove `alertCount` and `onNotificationPress` from the `DashboardHeaderProps` interface, delete the `handleNotificationSelect` handler, and remove the `<Pressable>` bell JSX.

## Dependencies

- [03-04](./task-03-04-verify-and-commit.md)

## Files

- Modify: `components/home/DashboardHeader.tsx:9-21,34-37,67-79`

## Steps

- [ ] **Step 1: Replace the `DashboardHeaderProps` interface**

Replace:

```ts
export interface DashboardHeaderProps {
  storeName: string;
  ownerInitials: string;
  activeTab: HomeSubTab;
  alertCount: number;
  showTopHeader: boolean;
  onTabPress: (tab: HomeSubTab) => void;
  onNotificationPress?: () => void;
}
```

with:

```ts
export interface DashboardHeaderProps {
  storeName: string;
  ownerInitials: string;
  activeTab: HomeSubTab;
  showTopHeader: boolean;
  onTabPress: (tab: HomeSubTab) => void;
}
```

- [ ] **Step 2: Remove the bell + handlers from inside the component**

Delete the entire `handleNotificationSelect` function (lines 34-37) and the `<Pressable>` bell block (lines 67-79). The `Header` collapses to:

```tsx
return (
  <View className="bg-paper-200 px-4 pt-1 pb-3">
    {showTopHeader && (
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-10 h-10 rounded-full bg-cinnamon-500 items-center justify-center mr-3 shadow-sm">
            <StyledText variant="extrabold" className="text-paper-50 text-base">
              {ownerInitials}
            </StyledText>
          </View>
          <View className="flex-1">
            <StyledText variant="extrabold" className="text-ink-900 text-lg" numberOfLines={1}>
              {storeName}
            </StyledText>
          </View>
        </View>
      </View>
    )}
    <SubTabControl tabs={tabs} activeTab={activeTab} onTabPress={onTabPress} containerClassName="mb-0" />
  </View>
);
```

## Commit

None yet — cleanup + commit happen in `task-04-03`.