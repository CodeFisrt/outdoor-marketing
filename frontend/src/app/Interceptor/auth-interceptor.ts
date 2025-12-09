import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // const token = localStorage.getItem('token');
  // console.log("Token from localStorage:", token);
  

  // const authReq = token
  //   ? req.clone({
  //       setHeaders: { Authorization: `Bearer ${token}` }
  //     })
  //   : req;

  // console.log("Final Request Headers:", authReq.headers);
  // console.log("Auth Header:", authReq.headers.get('Authorization'));


  // return next(authReq);

  // Browser check — MUST be very early in functional interceptor


  const isBrowser = typeof window !== 'undefined';

  let token: string | null = null;

  if (isBrowser) {
    try {
      token = localStorage.getItem('token');
      console.log("Token from localStorage:", token);
    } catch (e) {
      console.warn("localStorage access blocked:", e);
    }
  } else {
    console.log("SSR mode - skipping localStorage");
  }

  const authReq = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })
    : req;

  console.log("Final Request Headers:", authReq.headers);
  console.log("Auth Header:", authReq.headers.get('Authorization'));

  return next(authReq); // ✅ Functional interceptor syntax!

};

