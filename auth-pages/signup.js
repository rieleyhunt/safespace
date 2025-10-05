// Import Supabase client
import { supabase } from './supabaseClient.js';

// User signup form handler
document.getElementById('userSignupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullName = document.getElementById('userFullName').value;
  const email = document.getElementById('userEmail').value;
  const password = document.getElementById('userPassword').value;
  
  try {
    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          user_type: 'user'
        },
        emailRedirectTo: window.location.origin + '/index.html'
      }
    });
    
    if (error) {
      alert(error.message || 'Signup failed');
      console.error('Signup error:', error);
    } else {
      // Insert user into users table
      if (data.user) {
        const { error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              name: fullName,
              email: email,
              address: '' // Can be filled later
            }
          ]);
        
        if (userError) {
          console.error('User profile creation error:', userError);
          alert('Account created but profile setup failed: ' + userError.message);
        } else {
          // Store user type for later use
          localStorage.setItem('userType', 'user');
          alert('Signup successful! Welcome to SafeSpace!');
          window.location.href = '/user-index.html';
        }
      }
    }
  } catch (error) {
    console.error('Signup error:', error);
    alert('Signup failed. Please try again.');
  }
});

// Buddy signup form handler
document.getElementById('buddySignupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullName = document.getElementById('buddyFullName').value;
  const email = document.getElementById('buddyEmail').value;
  const password = document.getElementById('buddyPassword').value;
  
  try {
    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          user_type: 'buddy'
        },
        emailRedirectTo: window.location.origin + '/index.html'
      }
    });
    
    if (error) {
      alert(error.message || 'Signup failed');
      console.error('Signup error:', error);
    } else {
      // Insert buddy into buddies table
      if (data.user) {
        const { data: buddyData, error: buddyError } = await supabase
          .from('buddies')
          .insert([
            {
              id: data.user.id,
              name: fullName,
              email: email,
              address: '' // Can be filled later
            }
          ])
          .select()
          .single();
        
        if (buddyError) {
          console.error('Buddy profile creation error:', buddyError);
          alert('Account created but profile setup failed: ' + buddyError.message);
        } else {
          // Create buddy_profile entry
          const { error: profileError } = await supabase
            .from('buddy_profiles')
            .insert([
              {
                buddy_id: data.user.id,
                bio: '',
                photo_url: ''
              }
            ]);
          
          if (profileError) {
            console.error('Buddy profile details error:', profileError);
          }
          
          // Store user type for later use
          localStorage.setItem('userType', 'buddy');
          alert('Buddy application submitted! Welcome to SafeSpace!');
          window.location.href = '/buddy-index.html';
        }
      }
    }
  } catch (error) {
    console.error('Signup error:', error);
    alert('Signup failed. Please try again.');
  }
});

// Toggle form visibility
document.getElementById('userSignupBtn').addEventListener('click', () => {
  document.getElementById('userFormContainer').classList.toggle('active');
});

document.getElementById('buddySignupBtn').addEventListener('click', () => {
  document.getElementById('buddyFormContainer').classList.toggle('active');
});
