const Book = require('../models/Book');
const httpStatus = require('http-status');
const fs = require('fs');
const fsPromise = require('fs/promises')

exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    // Calcul de la note moyenne en fonction des notations du livre
    const totalRating = bookObject.ratings.reduce((accumulator, currentObject) => accumulator + currentObject.grade, 0);
    const averageRating = totalRating / bookObject.ratings.length;
    // Construction de l'URL de l'image en utilisant le protocole et le chemin du fichier téléchargé
    const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path}`;
    // Création d'une instance de modèle Book avec les données du livre
    const book = new Book({
      userId: req.auth.userId,
      title: bookObject.title,
      author: bookObject.author,
      imageUrl,
      year:bookObject.year,
      genre:bookObject.genre,
      ratings: [{
        userId: req.auth.userId ,
        grade:bookObject.ratings[0].grade,
      }],
      averageRating
    });
    // Sauvegarde du livre dans la base de données
    await book.save();

    return res.status(httpStatus.CREATED).json({ message: 'Objet enregistré !' });
  }
  // Gestion des erreurs, y compris la suppression du fichier téléchargé en cas d'erreur
  catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

exports.modifyBook = async (req, res, next) => {
  try {
    // Recherche du livre dans la base de données par son ID
    const bookFromDB = await Book.findOne({ _id: req.params.id });
    // Vérification de l'existence du livre
    if (!bookFromDB) {
      fs.unlinkSync(req.file.path)
      return res.status(httpStatus.NOT_FOUND).json({ message: 'non trouvé' });
    }
     // Vérification que l'utilisateur actuel est l'auteur du livre
    if (bookFromDB.userId !== req.auth.userId) {
      fs.unlinkSync(req.file.path)
      return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Not authorized' });
    }
    // Mise à jour des données du livre en fonction des modifications
    const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/${req.file.path}`
    } : { ...req.body };
    delete bookObject.userId;
    delete bookObject._id;

    // Mise à jour du livre dans la base de données
    await Book.updateOne({ _id: req.params.id }, { ...bookObject });
    // Suppression de l'ancienne image si une nouvelle image a été téléchargée
    if (req.file) {
      const oldFilename = bookFromDB.imageUrl.split("/images/")[1];
      fs.unlinkSync(`images/${oldFilename}`); 
    }

    return res.status(httpStatus.OK).json({ message: "mise à jour!" });

  }
  // Gestion des erreurs, y compris la suppression du fichier téléchargé en cas d'erreur
  catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    return res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    // Recherche du livre dans la base de données par son ID
    const book = await Book.findOne({ _id: req.params.id })
    // Vérification que l'utilisateur actuel est l'auteur du livre
    if (book.userId !== req.auth.userId){
      return res.status(httpStatus.NOT_FOUND).json({ message: "Livre non trouvé ou non autorisé" });
    } 
    // Extraction du nom de fichier de l'URL de l'image
    const filename = book.imageUrl.split('/images/')[1];
    try {
        // Suppression de l'image associée au livre
        await fsPromise.unlink(`images/${filename}`);
        // Suppression du livre de la base de données
        await Book.deleteOne({ _id: req.params.id });
        return res.status(httpStatus.OK).json({ message: 'Objet supprimé !' });
      } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
      }
  }
  catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: error.message })
  }
}

exports.getAllBooks = async (req, res, next) => {
  try {
    // Récupération de tous les livres dans la base de données
    const books = await Book.find()
    // Retour d'une réponse HTTP avec les livres
    return res.status(httpStatus.OK).json(books)
  }
  catch (error) {
    res.status(httpStatus.BAD_REQUEST).json({ error: error.message });
  }
}

exports.getOneBook = async (req, res, next) => {
  try {
    // Recherche d'un livre dans la base de données par son ID
    const oneBook = await Book.findOne({ _id: req.params.id })
    // Retour d'une réponse HTTP avec le livre 
    return res.status(httpStatus.OK).json(oneBook)
  } catch (error) {
    res.status(httpStatus.NOT_FOUND).json({ error: error.message });
  }
};

exports.getBestRating = async (req, res, next) => {
  try {
      // Récupération des livres triés par note moyenne décroissante (top 3)
        const books = await Book.find({})
          .sort({ averageRating: -1 })
          .limit(3);
        // Retour d'une réponse HTTP avec le top 3
        res.status(httpStatus.OK).json(books);
    } catch (error) {
        res.status(httpStatus.NOT_FOUND).json({ error: error.message });
    }
};

exports.createRating = async (req, res, next) => {
  try {
     // Obtention de l'ID du livre à noter depuis les paramètres de l'URL
    const bookId = req.params.id; 
     // Création de l'objet de notation
    const rating = {
      grade: req.body.rating,
      userId: req.body.userId,
    }
    // Recherche du livre dans la base de données par son ID
    const book = await Book.findOne({ _id: bookId })
    // Vérification de l'existence du livre
    if (!book) {
      return res.status(httpStatus.NOT_FOUND).json({ message: 'Livre non trouvé' });
    }
    // Vérification si l'utilisateur a déjà noté ce livre
    const existingRating = book.ratings.find(rating => rating.userId === req.auth.userId);
    if (existingRating) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: 'L\'utilisateur a déjà noté ce livre' });
    }
    // Ajout de la nouvelle notation à la liste des notations du livre
    book.ratings.push(rating)
    // Calcul de la nouvelle note moyenne en fonction de toutes les notations
    const totalRating = book.ratings.reduce((accumulator, currentObject) => accumulator + currentObject.grade, 0);
    const averageRating = totalRating / book.ratings.length
    // Mise à jour de la note moyenne du livre
    book.averageRating = Math.floor(averageRating);
     // Sauvegarde du livre mis à jour dans la base de données
    const updatedBook = await book.save()
    // Préparation de la réponse JSON avec les données du livre mis à jour
    const updatedBookFinal = {
      ...updatedBook._doc
    };
  // Retour d'une réponse HTTP avec le livre mis à jour
    return res.status(httpStatus.OK).json(updatedBookFinal);
  }
  // Gestion des erreurs, notamment les erreurs de la base de données
  catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
  }
}