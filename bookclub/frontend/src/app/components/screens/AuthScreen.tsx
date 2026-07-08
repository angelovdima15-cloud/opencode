import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, Phone, Eye, EyeOff, Gamepad2, Zap, Chrome } from "lucide-react";
import { GamingButton } from "../shared/GamingButton";
import { useAuth } from "../../context/AuthContext";

function InputField({
  icon: Icon,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  icon: React.ElementType;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background: "rgba(26, 26, 46, 0.8)",
        border: "1px solid rgba(124, 58, 237, 0.2)",
      }}
    >
      <Icon size={18} color="#8888AA" />
      <input
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: "#F1F1F1" }}
        placeholder={placeholder}
        type={isPassword ? (show ? "text" : "password") : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {isPassword && (
        <button type="button" onClick={() => setShow(!show)}>
          {show ? <EyeOff size={16} color="#8888AA" /> : <Eye size={16} color="#8888AA" />}
        </button>
      )}
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <InputField icon={Mail} placeholder="Email address" type="email" value={email} onChange={setEmail} />
      <InputField icon={Lock} placeholder="Password" type="password" value={password} onChange={setPassword} />
      <div className="text-right">
        <span className="text-xs" style={{ color: "#7C3AED" }}>Forgot password?</span>
      </div>
      <GamingButton variant="purple" size="lg" fullWidth onClick={onSuccess}>
        <Zap size={18} />
        Sign In
      </GamingButton>
    </div>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <InputField icon={User} placeholder="Full name" value={name} onChange={setName} />
      <InputField icon={Mail} placeholder="Email address" type="email" value={email} onChange={setEmail} />
      <InputField icon={Phone} placeholder="Phone number" type="tel" value={phone} onChange={setPhone} />
      <InputField icon={Lock} placeholder="Password" type="password" value={password} onChange={setPassword} />
      <GamingButton variant="cyan" size="lg" fullWidth onClick={onSuccess}>
        <Zap size={18} />
        Create Account
      </GamingButton>
    </div>
  );
}

export function AuthScreen() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSuccess = () => {
    login();
    navigate("/", { replace: true });
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0D0D1A 0%, #0F0F0F 100%)" }}
    >
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-80px] left-[-60px] w-[280px] h-[280px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-[40%] right-[-80px] w-[220px] h-[220px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-60px] left-[20%] w-[200px] h-[200px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)" }}
        />
      </div>

      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center pt-16 pb-8 px-6"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
            boxShadow: "0 0 40px rgba(124, 58, 237, 0.5), 0 0 80px rgba(6, 182, 212, 0.2)",
          }}
        >
          <Gamepad2 size={40} color="#FFFFFF" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white mb-1"
          style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px" }}
        >
          Book<span style={{ color: "#7C3AED" }}>PC</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm"
          style={{ color: "#8888AA" }}
        >
          Reserve your ultimate gaming setup
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-2 mt-4"
        >
          {["RTX 4090", "360Hz", "Pro Gear"].map((feat) => (
            <span
              key={feat}
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{
                background: "rgba(124, 58, 237, 0.15)",
                color: "#A78BFA",
                border: "1px solid rgba(124, 58, 237, 0.3)",
              }}
            >
              {feat}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex-1 mx-4 mb-4 rounded-3xl p-6"
        style={{
          background: "rgba(26, 26, 46, 0.9)",
          border: "1px solid rgba(124, 58, 237, 0.2)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Tabs */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "rgba(15, 15, 15, 0.6)" }}
        >
          {(["login", "register"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab ? "#7C3AED" : "transparent",
                color: activeTab === tab ? "#FFFFFF" : "#8888AA",
                boxShadow: activeTab === tab ? "0 0 12px rgba(124, 58, 237, 0.4)" : "none",
              }}
            >
              {tab === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === "login" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === "login" ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "login" ? (
              <LoginForm onSuccess={handleSuccess} />
            ) : (
              <RegisterForm onSuccess={handleSuccess} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-xs" style={{ color: "#8888AA" }}>or continue with</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Social auth */}
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSuccess}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#F1F1F1",
            }}
          >
            <Chrome size={18} />
            Google
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSuccess}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#F1F1F1",
            }}
          >
            <Phone size={18} />
            Phone
          </motion.button>
        </div>
      </motion.div>

      <p className="text-center text-xs pb-6" style={{ color: "#555570" }}>
        By continuing you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
}
