import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Router, Route, Switch, Redirect, useLocation } from 'wouter';
import { AppContextProvider } from './context/AppContext';
import { supabase } from './lib/supabase';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Habits } from './pages/Habits';
import { Notes } from './pages/Notes';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { Plans } from './pages/Plans';
import { Favorites } from './pages/Favorites';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import { AppShell } from './components/layout/AppShell';
import './index.css';

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
      if (!data.is_onboarded && location !== '/onboarding' && location !== '/auth') {
        setLocation('/onboarding');
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppContextProvider>
      <Router>
        <Switch>
          <Route path="/auth">
            {session ? <Redirect to="/dashboard" /> : <AuthPage />}
          </Route>
          
          <Route path="/onboarding">
            {!session ? <Redirect to="/auth" /> : <OnboardingPage />}
          </Route>

          <Route path="/dashboard">
            {!session ? <Redirect to="/auth" /> : <AppShell><Dashboard /></AppShell>}
          </Route>

          <Route path="/tasks">
            {!session ? <Redirect to="/auth" /> : (
              <AppShell>
                <Tasks 
                  currentUser={profile} 
                />
              </AppShell>
            )}
          </Route>

          <Route path="/habits">
            {!session ? <Redirect to="/auth" /> : <AppShell><Habits /></AppShell>}
          </Route>

          <Route path="/notes">
            {!session ? <Redirect to="/auth" /> : (
              <AppShell>
                <Notes />
              </AppShell>
            )}
          </Route>

          <Route path="/chat">
            {!session ? <Redirect to="/auth" /> : (
              <AppShell>
                <Chat />
              </AppShell>
            )}
          </Route>



          <Route path="/plans">
            {!session ? <Redirect to="/auth" /> : (
              <AppShell>
                <Plans plans={[]} onAskAI={() => {}} />
              </AppShell>
            )}
          </Route>

          <Route path="/favorites">
            {!session ? <Redirect to="/auth" /> : (
              <AppShell>
                <Favorites favorites={[]} onAskAI={() => {}} onRemove={() => {}} />
              </AppShell>
            )}
          </Route>

          <Route path="/settings">
            {!session ? <Redirect to="/auth" /> : <AppShell><Settings /></AppShell>}
          </Route>

          <Route path="/">
            <Redirect to={session ? "/dashboard" : "/auth"} />
          </Route>

          <Route>
            <AppShell>
              <div className="min-h-screen flex items-center justify-center">
                <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              </div>
            </AppShell>
          </Route>
        </Switch>
      </Router>
    </AppContextProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
