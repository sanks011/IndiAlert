import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Return user data (excluding password)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    return NextResponse.json({ 
      message: "Login successful.", 
      user: userData 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "An error occurred while signing in." },
      { status: 500 }
    );
  }
}
