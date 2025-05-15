## Drizzle SQLite DB Setup

```sh
npm exec drizzle-kit generate
npm exec drizzle-kit push
```

## Mediapipe

![Mediapipe Pose Landmarks](https://camo.githubusercontent.com/d3afebfc801ee1a094c28604c7a0eb25f8b9c9925f75b0fff4c8c8b4871c0d28/68747470733a2f2f6d65646961706970652e6465762f696d616765732f6d6f62696c652f706f73655f747261636b696e675f66756c6c5f626f64795f6c616e646d61726b732e706e67)

## KeyInstruction Component

```vue
<KeyInstruction
    :instructions="[
        { button: 'Enter', action: 'continue' },
        { button: 'Esc', action: 'cancel' },
    ]"
/>
```

or

```vue
<KeyInstruction button="Enter" action="continue" />
```
