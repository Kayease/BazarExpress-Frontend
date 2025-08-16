import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface Address {
  street: string;
  landmark: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  address?: Address | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  loading: false,
  error: null,
};

const API = process.env.NEXT_PUBLIC_API_URL;

export const login = createAsyncThunk(
  'auth/login',
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Correct endpoint: /api/auth/login
      const res = await axios.post(`${API}/auth/login`, data);
      
      // Clean up unregistered carts when user logs in
      if (res.data.user && res.data.user.id) {
        try {
          // Get session ID from localStorage
          const sessionId = localStorage.getItem('cart_session_id');
          if (sessionId) {
            await axios.post(`${API}/abandoned-carts/cleanup-on-login`, {
              userId: res.data.user.id,
              sessionId
            });
            console.log('Cleaned up unregistered carts on login');
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup unregistered carts on login:', cleanupError);
          // Don't fail login if cleanup fails
        }
      }
      
      return res.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      return rejectWithValue(errorMsg);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    data: { name: string; email: string; password: string; phone?: string; dateOfBirth?: string },
    { rejectWithValue }
  ) => {
    try {
      // Correct endpoint: /api/auth/register
      const res = await axios.post(`${API}/auth/register`, data);
      return res.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Registration failed';
      return rejectWithValue(errorMsg);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    data: { name?: string; email?: string; phone?: string; dateOfBirth?: string; address?: Address },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;
      // Use the same endpoint style as other code
      const res = await axios.put(`${API}/auth/profile`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.user;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Profile update failed';
      return rejectWithValue(errorMsg);
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;
            // Token sent to backend
            const res = await axios.get(`${API}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data; // Should be { user, ...stats }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      if (typeof window !== 'undefined') localStorage.removeItem('token');
    },
    clearError(state) {
      state.error = null;
    },
    setToken(state, action) {
      state.token = action.payload;
      if (typeof window !== 'undefined') localStorage.setItem('token', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        // Support both { user, token } and { ...user, token }
        if (action.payload.user) {
          state.user = action.payload.user;
          state.token = action.payload.token;
        } else {
          // If backend returns { ...user, token }
          const { token, ...user } = action.payload;
          state.user = user as any;
          state.token = token as any;
        }
        state.error = null;
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', state.token!);
          // Persist contact info for tracking when logged out later
          try {
            const existing = localStorage.getItem('guest_info');
            const parsed = existing ? JSON.parse(existing) : {};
            const merged = {
              ...parsed,
              email: state.user?.email || parsed.email,
              phone: state.user?.phone || parsed.phone,
              updatedFrom: 'login',
              updatedAt: new Date().toISOString(),
            };
            localStorage.setItem('guest_info', JSON.stringify(merged));
          } catch (e) {
            console.warn('Failed to persist guest contact info on login:', e);
          }
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        // Support both { user, token } and { ...user, token }
        if (action.payload.user) {
          state.user = action.payload.user;
          state.token = action.payload.token;
        } else {
          const { token, ...user } = action.payload;
          state.user = user;
          state.token = token;
        }
        state.error = null;
        if (typeof window !== 'undefined') localStorage.setItem('token', state.token!);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload.user || action.payload;
        // Persist contact info once profile is fetched (OTP login flow)
        if (typeof window !== 'undefined') {
          try {
            const existing = localStorage.getItem('guest_info');
            const parsed = existing ? JSON.parse(existing) : {};
            const merged = {
              ...parsed,
              email: state.user?.email || parsed.email,
              phone: state.user?.phone || parsed.phone,
              updatedFrom: 'profile',
              updatedAt: new Date().toISOString(),
            };
            localStorage.setItem('guest_info', JSON.stringify(merged));
          } catch (e) {
            console.warn('Failed to persist guest contact info on profile fetch:', e);
          }
        }
      });
  },
});

export const { logout, clearError, setToken } = authSlice.actions;
export default authSlice.reducer;