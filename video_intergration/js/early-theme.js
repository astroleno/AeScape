/**
 * 早期主题初始化 - 避免白色闪现
 * 必须在页面加载最早期执行，确保主题第一时间可用
 */

// 同步设置时间主题，避免任何闪现
(function() {
  try {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour < 6 || hour > 19;
    
    let theme;
    if (isNight) {
      theme = {
        gradient: 'linear-gradient(135deg, rgb(31, 40, 91) 0%, rgb(46, 54, 96) 100%)',
        primary: 'rgb(63, 81, 181)',
        secondary: 'rgb(92, 107, 192)',
        accent: 'rgb(149, 117, 205)',
        text: 'rgba(255, 255, 255, 0.98)'
      };
    } else {
      // 根据时间设置不同的日间主题
      if (hour >= 6 && hour < 10) {
        // 晨光主题
        theme = {
          gradient: 'linear-gradient(135deg, rgba(255, 183, 77, 0.25) 0%, rgba(255, 138, 101, 0.05) 100%)',
          primary: 'rgba(255, 183, 77, 0.6)',
          secondary: 'rgba(255, 138, 101, 0.4)',
          accent: 'rgba(255, 204, 128, 0.3)',
          text: 'rgba(33, 33, 33, 0.9)'
        };
      } else if (hour >= 10 && hour < 14) {
        // 上午主题
        theme = {
          gradient: 'linear-gradient(135deg, rgba(66, 165, 245, 0.2) 0%, rgba(102, 187, 106, 0.05) 100%)',
          primary: 'rgba(66, 165, 245, 0.5)',
          secondary: 'rgba(102, 187, 106, 0.4)',
          accent: 'rgba(38, 198, 218, 0.3)',
          text: 'rgba(33, 33, 33, 0.9)'
        };
      } else if (hour >= 14 && hour < 17) {
        // 下午主题
        theme = {
          gradient: 'linear-gradient(135deg, rgba(255, 167, 38, 0.22) 0%, rgba(66, 165, 245, 0.05) 100%)',
          primary: 'rgba(255, 167, 38, 0.5)',
          secondary: 'rgba(66, 165, 245, 0.4)',
          accent: 'rgba(102, 187, 106, 0.3)',
          text: 'rgba(33, 33, 33, 0.9)'
        };
      } else if (hour >= 17 && hour < 19) {
        // 傍晚主题
        theme = {
          gradient: 'linear-gradient(135deg, rgba(239, 108, 0, 0.15) 0%, rgba(255, 61, 0, 0.1) 100%)',
          primary: 'rgba(239, 108, 0, 0.5)',
          secondary: 'rgba(255, 61, 0, 0.4)',
          accent: 'rgba(255, 179, 0, 0.3)',
          text: 'rgba(33, 33, 33, 0.9)'
        };
      } else {
        // 默认主题
        theme = {
          gradient: 'linear-gradient(135deg, rgba(255, 183, 77, 0.25) 0%, rgba(255, 138, 101, 0.05) 100%)',
          primary: 'rgba(255, 183, 77, 0.6)',
          secondary: 'rgba(255, 138, 101, 0.4)',
          accent: 'rgba(255, 204, 128, 0.3)',
          text: 'rgba(33, 33, 33, 0.9)'
        };
      }
    }
    
    // 立即应用主题到CSS变量
    const root = document.documentElement;
    root.style.setProperty('--theme-gradient', theme.gradient);
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-text', theme.text);
    
    console.log('[EarlyTheme] 时间主题已立即应用:', {
      hour,
      isNight,
      gradient: theme.gradient
    });
    
    // 确保body背景立即生效
    function applyBodyBackground() {
      if (document.body) {
        document.body.style.background = theme.gradient;
        document.body.style.setProperty('background', theme.gradient, 'important');
      }
    }
    
    // 立即尝试应用，如果body还没加载就等待
    applyBodyBackground();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyBodyBackground);
    }
    
  } catch (error) {
    console.error('[EarlyTheme] 早期主题初始化失败:', error);
    // 静默处理错误，CSS中的fallback会生效
  }
})();