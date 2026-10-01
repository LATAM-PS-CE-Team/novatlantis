import { createTheme } from '@mui/material/styles';

export const novatlantisTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#002046',
      light: '#00356e',
      dark: '#001530',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#b4c5ff',
      light: '#dae2ff',
      dark: '#8299e6',
      contrastText: '#001848'
    },
    background: {
      default: '#f8f9fb',
      paper: '#ffffff'
    },
    text: {
      primary: '#191c1e',
      secondary: '#43474f'
    }
  },
  typography: {
    fontFamily: '"Public Sans", "Inter", system-ui, -apple-system, sans-serif',
    h1: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 800
    },
    h2: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 800
    },
    h3: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 700
    },
    h4: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 700
    },
    h5: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 700
    },
    h6: {
      fontFamily: '"Merriweather", Georgia, serif',
      fontWeight: 700
    },
    button: {
      textTransform: 'none',
      fontWeight: 700
    }
  },
  shape: {
    borderRadius: 6
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(0, 32, 70, 0.18)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        outlined: {
          borderColor: '#d8dde6'
        }
      }
    }
  }
});
