module.exports = (sequelize, Sequelize) => {
  const LlmHistory = sequelize.define(
    'answerHistory',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      answerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'answers', // Ensure this matches the actual table name
          key: 'id',
        },
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Ensure this matches the actual table name
          key: 'id',
        },
      },
      entityType: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      answerText: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      selectedOptionIds: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: true,
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      systemPrompt: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'answerHistory', // Explicitly define the table name
      timestamps: true, // Enables createdAt and updatedAt fields
    }
  );

  // ✅ Automatically set the correct version before inserting a new record
  LlmHistory.beforeCreate(async (history) => {
    const latestHistory = await LlmHistory.findOne({
      where: { answerId: history.answerId, entityType: history.entityType },
      order: [['version', 'DESC']],
    });

    history.version = latestHistory ? latestHistory.version + 1 : 1;
  });

  return LlmHistory;
};
