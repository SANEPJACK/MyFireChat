# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Supabase setup (Auth + Database + Storage)

1. สร้าง Supabase project (ใช้ Region ใกล้ผู้ใช้) แล้วคัด `Project URL` และ `anon public key` ใส่ `.env` จาก `.env.example`
2. เปิด Authentication > Providers > Email แล้วเปิด Email/Password
3. สร้างตารางใน SQL Editor (ตัวอย่าง schema):
   ```sql
   create table profiles (
     id uuid primary key references auth.users (id) on delete cascade,
     email text,
     display_name text,
     full_name text,
     bio text,
     age int,
     avatar_url text,
     cover_url text
   );

   create table messages (
     id uuid primary key default gen_random_uuid(),
     room_id text not null,
     user_id uuid references auth.users (id) on delete cascade,
     display_name text,
     text text,
     created_at timestamp with time zone default now()
   );
   create index messages_room_id_created_at_idx on messages (room_id, created_at desc);

   create table friend_requests (
     id uuid primary key default gen_random_uuid(),
     from_user_id uuid references auth.users (id) on delete cascade,
     to_user_id text,
     status text default 'pending',
     created_at timestamp with time zone default now()
   );
   ```
4. เปิด Storage แล้วสร้าง bucket ชื่อ `profiles` (Public) ใช้เก็บ avatars/covers
5. ถ้าไม่ต้องการให้ผู้ใช้ต้องกดยืนยันอีเมล ให้ไปที่ Authentication > Providers > Email แล้วปิด “Confirm email”
5. รัน `npx expo start -c`

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
