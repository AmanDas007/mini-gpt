import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/db/connectDB";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error(error?.message);
    return NextResponse.json(
      { message: "Registration failed" },
      { status: 500 }
    );
  }
}