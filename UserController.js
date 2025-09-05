const User = require("../models/User");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const jwtSecret = process.env.JWT_SECRET;

// Geração de token do usuário
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: "7d",
  });
};

// Registrar usuário e fazer login
const register = async (req, res) => {
  const { name, email, password } = req.body;

  //  Cheque se o usuário existe
  const user = await User.findOne({ email });

  if (user) {
    res.status(422).json({ errors: ["Por favor, utilize outro e-mail."] });
    return;
  }

  // Gerar hash da senha
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(password, salt);

  // Criar usuário
  const newUser = await User.create({
    name,
    email,
    password: passwordHash,
  });

  //  Se o usuário foi criado com sucesso, retorne o token
  if (!newUser) {
    res.status(422).json({
      errors: ["Houve um erro, por favor tente novamente mais tarde."],
    });
    return;
  }

  res.status(201).json({
    _id: newUser._id,
    token: generateToken(newUser._id),
  });
};

// Pegue o usuário conectado
const getCurrentUser = async (req, res) => {
  const user = req.user;

  res.status(200).json(user);
};

//  Entrar como usuário
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  // Cheque se o usuário existe
  if (!user) {
    res.status(404).json({ errors: ["Usuário não encontrado!"] });
    return;
  }

  // Cheque se a senha corresponde
  if (!(await bcrypt.compare(password, user.password))) {
    res.status(422).json({ errors: ["Senha inválida!"] });
    return;
  }

  // Retornar usuário com token
  res.status(200).json({
    _id: user._id,
    profileImage: user.profileImage,
    token: generateToken(user._id),
  });
};

// Atualizar usuário
const update = async (req, res) => {
  const { name, password, bio } = req.body;

  let profileImage = null;

  if (req.file) {
    profileImage = req.file.filename;
  }

  const reqUser = req.user;

  const user = await User.findById(mongoose.Types.ObjectId(reqUser._id)).select(
    "-password"
  );

  if (name) {
    user.name = name;
  }

  if (password) {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    user.password = passwordHash;
  }

  if (profileImage) {
    user.profileImage = profileImage;
  }

  if (bio) {
    user.bio = bio;
  }

  await user.save();

  res.status(200).json(user);
};

// Pegue o usuário pelo id
const getUserById = async (req, res) => {
  const { id } = req.params;

  function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "ID de usuário inválido." });
  }

  const user = await User.findById(mongoose.Types.ObjectId(id)).select(
    "-password"
  );

  // Cheque se o usuário existe
  if (!user) {
    res.status(404).json({ errors: ["Usuário não encontrado!"] });
    return;
  }

  res.status(200).json(user);
};

module.exports = {
  register,
  getCurrentUser,
  login,
  update,
  getUserById,
};
