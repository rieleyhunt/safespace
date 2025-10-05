// Supabase auth utility
import { supabase } from './auth-pages/supabaseClient.js';

const AUTH = {
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
  
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  async checkAuth() {
    try {
      const session = await this.getSession();
      return session !== null;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  },
  
  async getUserProfile() {
    try {
      const user = await this.getUser();
      if (!user) return null;
      
      // Check if user is in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        return { ...userData, userType: 'user' };
      }
      
      // Check if user is in buddies table
      const { data: buddyData, error: buddyError } = await supabase
        .from('buddies')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (buddyData) {
        // Also get buddy profile details
        const { data: profileData } = await supabase
          .from('buddy_profiles')
          .select('*')
          .eq('buddy_id', user.id)
          .single();
        
        return { 
          ...buddyData, 
          profile: profileData,
          userType: 'buddy' 
        };
      }
      
      return null;
    } catch (error) {
      console.error('Get user profile failed:', error);
      return null;
    }
  },
  
  async getUserType() {
    const userType = localStorage.getItem('userType');
    if (userType) return userType;
    
    // Fetch from database if not in localStorage
    const profile = await this.getUserProfile();
    return profile?.userType || null;
  },
  
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      localStorage.removeItem('userType');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    window.location.href = '/auth-pages/login.html';
  }
};
