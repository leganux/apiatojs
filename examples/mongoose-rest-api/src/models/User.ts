import { Schema, model, Document } from 'mongoose';

interface IUser extends Document {
    name: string;
    email: string;
    age: number;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v: string) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: (props: { value: string }) => `${props.value} is not a valid email!`
        }
    },
    age: {
        type: Number,
        required: true,
        min: [0, 'Age must be a positive number']
    }
}, {
    timestamps: true
});

const User = model<IUser>('User', userSchema);

export default User;
