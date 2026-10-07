using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocabMate.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class PreserveReviewIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OriginalVocabularyId",
                table: "QuizResults",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // A deleted vocabulary identity cannot be recovered from old rows; keep
            // those individual answers distinct instead of grouping all as Guid.Empty.
            migrationBuilder.Sql("UPDATE \"QuizResults\" SET \"OriginalVocabularyId\" = COALESCE(\"VocabularyId\", \"Id\")");

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_OneActiveWeeklyPerUser",
                table: "Quizzes",
                column: "UserId",
                unique: true,
                filter: "\"QuizType\" = 'WEEKLY' AND \"CompletedAt\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Quizzes_OneActiveWeeklyPerUser",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "OriginalVocabularyId",
                table: "QuizResults");
        }
    }
}
