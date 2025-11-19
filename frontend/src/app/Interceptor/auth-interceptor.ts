import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  console.log("Token from localStorage:", token);
  

  const authReq = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })
    : req;

  console.log("Final Request Headers:", authReq.headers);
  console.log("Auth Header:", authReq.headers.get('Authorization'));


  return next(authReq);
};

