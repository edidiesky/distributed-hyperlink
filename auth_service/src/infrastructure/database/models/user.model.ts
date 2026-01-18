export interface User {
  id: string;                   
  email: string;                
  password_hash: string;         
  first_name: string;           
  last_name: string;            
  is_verified: boolean;        
  is_active: boolean;           
  last_login_at: Date | null;    
  created_at: Date;    
  updated_at: Date;  
}

export interface SafeUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_verified: boolean;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}


export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    full_name: `${user.first_name} ${user.last_name}`,
    is_verified: user.is_verified,
    is_active: user.is_active,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
