// Import Supabase client
import { supabase } from './supabaseClient.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('emailOrUsername').value;
  const password = document.getElementById('password').value;
  
  try {
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      alert(error.message || 'Login failed');
      console.error('Login error:', error);
    } else {
      // Successfully logged in
      console.log('User logged in:', data.user.email);
      
      // Check if user is in users table or buddies table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', data.user.id)
        .single();
      
      if (userData) {
        console.log('Logged in as User:', userData.name);
        localStorage.setItem('userType', 'user');
      } else {
        // Check buddies table
        const { data: buddyData, error: buddyError } = await supabase
          .from('buddies')
          .select('name, email')
          .eq('id', data.user.id)
          .single();
        
        if (buddyData) {
          console.log('Logged in as Buddy:', buddyData.name);
          localStorage.setItem('userType', 'buddy');
        }
      }
      
      window.location.href = '/index.html';
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed. Please try again.');
  }
});
