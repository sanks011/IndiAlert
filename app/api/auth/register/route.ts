import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });

    if (user) {
      return NextResponse.json(
        { message: "User already exists." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword });

    // Return user data (excluding password)
    const userData = {
      id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name || newUser.email, // fallback to email if no name
    };

    return NextResponse.json({ 
      message: "User registered.", 
      user: userData 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "An error occurred while registering the user." },
      { status: 500 }
    );
  }
}
