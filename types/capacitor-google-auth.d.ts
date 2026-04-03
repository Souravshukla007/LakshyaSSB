declare module '@codetrix-studio/capacitor-google-auth' {
    export interface GoogleAuthUser {
        authentication: {
            idToken: string;
            accessToken: string;
        };
        email: string;
        familyName: string;
        givenName: string;
        id: string;
        imageUrl: string;
        name: string;
    }

    export const GoogleAuth: {
        initialize(options?: any): void;
        signIn(): Promise<GoogleAuthUser>;
        refresh(): Promise<any>;
        signOut(): Promise<void>;
    };
}
