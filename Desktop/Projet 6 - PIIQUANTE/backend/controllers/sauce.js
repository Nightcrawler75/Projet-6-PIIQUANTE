const Sauce = require("../models/sauce");
const fs = require("fs");

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });

  sauce
    .save()
    .then(() => {
      res.status(201).json({ message: "Objet enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
      }
    : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.likeSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      const sauceObject = {};
      switch (req.body.like) {
        case 1:
          if (!sauce.usersLiked.includes(req.auth.userId)) {
            sauceObject.usersLiked = [...sauce.usersLiked, req.auth.userId];
            sauceObject.likes = sauce.likes + 1;
          }
          if (sauce.usersDisliked.includes(req.auth.userId)) {
            sauceObject.usersDisliked = sauce.usersDisliked.filter((user) => user != req.auth.userId);
            sauceObject.dislikes - 1;
          }

          break;
        case 0:
          if (sauce.usersLiked.includes(req.auth.userId)) {
            sauceObject.usersLiked = sauce.usersLiked.filter((user) => user != req.auth.userId);
            sauceObject.likes = sauce.likes - 1;
          }
          if (sauce.usersDisliked.includes(req.auth.userId)) {
            sauceObject.usersDisliked = sauce.usersDisliked.filter((user) => user != req.auth.userId);
            sauceObject.dislikes = sauce.dislikes - 1;
          }
          break;
        case -1:
          if (sauce.usersLiked.includes(req.auth.userId)) {
            sauceObject.usersLiked = sauce.usersLiked.filter((user) => user != req.auth.userId);
            sauceObject.likes = sauce.likes - 1;
          }
          if (!sauce.usersDisliked.includes(req.auth.userId)) {
            sauceObject.usersDisliked = [...sauce.usersDisliked, req.auth.userId];
            sauceObject.dislikes = sauce.dislikes + 1;
          }

          break;

        default:
          break;
      }
      Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: "Objet modifié!" }))
        .catch((error) => res.status(401).json({ error }));
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};
