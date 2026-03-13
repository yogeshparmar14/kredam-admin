import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ArenaState {
  selectedArenaId: string;
}

const initialState: ArenaState = {
  selectedArenaId: '',
};

const arenaSlice = createSlice({
  name: 'arena',
  initialState,
  reducers: {
    setSelectedArena: (state, action: PayloadAction<string>) => {
      state.selectedArenaId = action.payload;
    },
  },
});

export const { setSelectedArena } = arenaSlice.actions;
export default arenaSlice.reducer;
