<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsManager
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userRole = $request->user()?->role;

        if (!in_array($userRole, ['Admin', 'Manager'])) {
            return response()->json(['message' => 'Forbidden. Admin or Manager role required.'], 403);
        }

        return $next($request);
    }
}
